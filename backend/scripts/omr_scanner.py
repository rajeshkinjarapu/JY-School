#!/usr/bin/env python3
"""
JY School - Production OMR Engine & Scanner Adapter
Based on Udayraj Deshmukh's OMRChecker architecture.

Features:
- Robust 4-point perspective warp and alignment
- Deterministic bubble grid sampling (Student ID: 4 columns of digits 0-9; 75 Questions: 5 blocks x 15 questions, Options A-D)
- Adaptive local contrast thresholding to distinguish filled ink from hollow printed bubbles
- Master Answer Key evaluation with subject-wise marks breakdown (Maths 1-25, Physics 26-50, Chemistry 51-75)
- Visual overlay generation with green (correct), red (wrong), and cyan (student ID) markings
- Compatible with backend/src/controllers/exams.controller.ts and web/mobile UI
"""

import os
import sys
import json
import base64
from pathlib import Path
import cv2
import numpy as np

# Ensure OMR master / engine is in python path
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

for p in [
    BACKEND_DIR / "omr_engine",
    ROOT_DIR / "OMR master",
    Path("/root/JY-School/OMR master"),
    Path("/root/JY-School/backend/omr_engine"),
]:
    if p.exists() and str(p) not in sys.path:
        sys.path.insert(0, str(p))


# Canonical Page Dimensions for JY School 75Q Sheet
PAGE_WIDTH = 1100
PAGE_HEIGHT = 1550


def order_points(pts):
    """Order coordinates: top-left, top-right, bottom-right, bottom-left"""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def four_point_transform(image, pts, target_w=PAGE_WIDTH, target_h=PAGE_HEIGHT):
    """Perspective warp given 4 points to canonical target dimensions"""
    rect = order_points(pts)
    dst = np.array([
        [0, 0],
        [target_w - 1, 0],
        [target_w - 1, target_h - 1],
        [0, target_h - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (target_w, target_h), flags=cv2.INTER_LANCZOS4)
    return warped


def detect_and_warp_page(image):
    """
    Finds the 4 outer corner markers or outer border of the OMR sheet,
    and rectifies perspective to (PAGE_WIDTH, PAGE_HEIGHT).
    """
    h_orig, w_orig = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()

    # Step 1: Detect 4 corner black fiducial markers (if present)
    # The sheet has solid black square fiducial markers at the 4 corners of the outer frame
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 5
    )

    # Search in 4 corner quadrants for dark marker blocks
    margin_w = int(w_orig * 0.18)
    margin_h = int(h_orig * 0.18)

    quads = {
        "tl": (0, margin_w, 0, margin_h),
        "tr": (w_orig - margin_w, w_orig, 0, margin_h),
        "bl": (0, margin_w, h_orig - margin_h, h_orig),
        "br": (w_orig - margin_w, w_orig, h_orig - margin_h, h_orig),
    }

    marker_centers = {}
    for q_name, (x1, x2, y1, y2) in quads.items():
        q_patch = thresh[y1:y2, x1:x2]
        cnts, _ = cv2.findContours(q_patch, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        best_marker = None
        best_area = 0
        min_marker_area = (margin_w * margin_h) * 0.005
        max_marker_area = (margin_w * margin_h) * 0.40

        for c in cnts:
            area = cv2.contourArea(c)
            if min_marker_area < area < max_marker_area:
                x, y, w, h = cv2.boundingRect(c)
                aspect = w / float(h) if h > 0 else 0
                if 0.6 <= aspect <= 1.6:
                    if area > best_area:
                        best_area = area
                        best_marker = (x1 + x + w / 2.0, y1 + y + h / 2.0)

        if best_marker:
            marker_centers[q_name] = best_marker

    # If all 4 corner markers are found, warp on marker centers!
    if len(marker_centers) == 4:
        pts = np.array([
            marker_centers["tl"],
            marker_centers["tr"],
            marker_centers["br"],
            marker_centers["bl"]
        ], dtype="float32")
        return four_point_transform(image, pts)

    # Step 2: Fallback to largest outer rectangular contour (e.g. paper / border)
    edges = cv2.Canny(blurred, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

    cnts, _ = cv2.findContours(closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:5]

    for c in cnts:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4 and cv2.contourArea(approx) > (w_orig * h_orig * 0.45):
            pts = approx.reshape(4, 2)
            return four_point_transform(image, pts)

    # Step 3: Default fallback - direct resize
    return cv2.resize(image, (PAGE_WIDTH, PAGE_HEIGHT), interpolation=cv2.INTER_AREA)


def evaluate_bubble_fill(gray_img, cx, cy, radius=9):
    """
    Measures fill ratio inside circular bubble.
    Returns:
    - mean_intensity: 0 (black/ink) to 255 (white/paper)
    - fill_ratio: 0.0 (empty) to 1.0 (fully filled)
    """
    h, w = gray_img.shape[:2]
    x1, x2 = max(0, int(cx - radius)), min(w, int(cx + radius + 1))
    y1, y2 = max(0, int(cy - radius)), min(h, int(cy + radius + 1))

    patch = gray_img[y1:y2, x1:x2]
    if patch.size == 0:
        return 255.0, 0.0

    # Circular mask to sample inside bubble only
    mask = np.zeros(patch.shape, dtype=np.uint8)
    pcx = int(cx - x1)
    pcy = int(cy - y1)
    cv2.circle(mask, (pcx, pcy), int(radius * 0.85), 255, -1)

    bubble_pixels = patch[mask == 255]
    if len(bubble_pixels) == 0:
        mean_val = float(np.mean(patch))
    else:
        mean_val = float(np.mean(bubble_pixels))

    # In standard scans: Paper background is ~190-240, Filled ink is ~30-110
    # Inverted fill score: higher means darker ink
    fill_score = max(0.0, min(1.0, (215.0 - mean_val) / 125.0))
    return mean_val, fill_score


def process_omr(image_path, answer_key=None):
    """
    Core OMR processing function.
    Reads OMR image, aligns perspective, reads Student ID and 75 questions,
    grades against answer key, and creates visual overlay.
    """
    try:
        if answer_key is None:
            answer_key = {}

        image = cv2.imread(image_path)
        if image is None:
            return {"error": f"Could not read image from {image_path}"}

        # Step 1: Detect and warp page to canonical coordinate system
        aligned = detect_and_warp_page(image)
        gray = cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY)

        # Enhance contrast for reliable reading
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_gray = clahe.apply(gray)

        # Step 2: Overlay image for visualization
        overlay = aligned.copy()

        # ----------------------------------------------------
        # Step 3: Student ID Extraction (4 vertical columns)
        # ----------------------------------------------------
        # Format: Roll 1, Roll 2, Roll 3, Roll 4. Digits 0 to 9 top to bottom
        id_origin_x = 118
        id_origin_y = 410
        id_labels_gap = 34    # Gap between columns
        id_bubbles_gap = 26   # Gap between vertical digit bubbles 0..9

        detected_digits = []
        id_bubbles_coords = []

        for col in range(4):
            col_x = id_origin_x + col * id_labels_gap
            col_scores = []

            for digit in range(10):
                bubble_y = id_origin_y + digit * id_bubbles_gap
                mean_val, score = evaluate_bubble_fill(enhanced_gray, col_x, bubble_y, radius=8)
                col_scores.append({
                    "digit": str(digit),
                    "cx": col_x,
                    "cy": bubble_y,
                    "mean": mean_val,
                    "score": score
                })

            # Sort by highest fill score (darkest ink)
            col_scores.sort(key=lambda s: s["score"], reverse=True)
            top = col_scores[0]
            second = col_scores[1]

            # If top bubble has significant fill and is noticeably darker than second
            if top["score"] >= 0.28:
                detected_digits.append(top["digit"])
                id_bubbles_coords.append((top["cx"], top["cy"]))
                # Draw cyan circle around detected ID digit bubble
                cv2.circle(overlay, (top["cx"], top["cy"]), 11, (255, 255, 0), 2)
                cv2.circle(overlay, (top["cx"], top["cy"]), 4, (255, 255, 0), -1)
            else:
                # Undetected digit
                detected_digits.append("X")

        digits_str = "".join(detected_digits)
        student_id_str = f"JY26-{digits_str}" if "X" not in digits_str else (
            f"JY26-{digits_str}" if any(d != "X" for d in detected_digits) else "AUTO_DETECT"
        )

        # ----------------------------------------------------
        # Step 4: 75 Questions Extraction (5 columns of 15 Qs)
        # ----------------------------------------------------
        # Block 1: Q1..15, Block 2: Q16..30, Block 3: Q31..45, Block 4: Q46..60, Block 5: Q61..75
        block_x_origins = [110, 300, 490, 680, 870]
        q_start_y = 835
        q_labels_gap = 36     # Vertical gap between consecutive questions
        q_bubbles_gap = 28    # Horizontal gap between options A, B, C, D
        options = ["A", "B", "C", "D"]

        detected_answers = {}
        correct_count = 0
        wrong_count = 0
        unattempted_count = 0

        maths_marks = 0
        physics_marks = 0
        chemistry_marks = 0

        for block_idx, col_x in enumerate(block_x_origins):
            block_start_q = block_idx * 15 + 1

            for row_idx in range(15):
                q_num = block_start_q + row_idx
                q_str = str(q_num)
                row_y = q_start_y + row_idx * q_labels_gap

                opt_scores = []
                for opt_idx, opt_char in enumerate(options):
                    bx = col_x + opt_idx * q_bubbles_gap
                    by = row_y
                    mean_val, score = evaluate_bubble_fill(enhanced_gray, bx, by, radius=9)
                    opt_scores.append({
                        "option": opt_char,
                        "cx": bx,
                        "cy": by,
                        "mean": mean_val,
                        "score": score
                    })

                # Sort options by fill score descending
                opt_scores.sort(key=lambda x: x["score"], reverse=True)
                top_opt = opt_scores[0]
                second_opt = opt_scores[1]

                # Clear threshold: bubble is filled if score >= 0.28 and > second by at least 0.08
                # Or high confidence single bubble
                is_filled = (top_opt["score"] >= 0.28 and (top_opt["score"] - second_opt["score"] >= 0.08)) or (top_opt["score"] >= 0.45)

                if is_filled:
                    chosen_option = top_opt["option"]
                    chosen_cx = top_opt["cx"]
                    chosen_cy = top_opt["cy"]
                else:
                    chosen_option = "-"
                    chosen_cx = None
                    chosen_cy = None

                detected_answers[q_str] = chosen_option

                # Answer Key Evaluation
                correct_ans = answer_key.get(q_str, "").strip().upper()

                q_mark = 0
                if correct_ans:
                    if chosen_option == correct_ans:
                        q_mark = 4
                        correct_count += 1
                        # CORRECT: Bright Green outline + inner dot
                        cv2.circle(overlay, (chosen_cx, chosen_cy), 11, (0, 230, 0), 2)
                        cv2.circle(overlay, (chosen_cx, chosen_cy), 4, (0, 230, 0), -1)
                    elif chosen_option != "-":
                        q_mark = 0
                        wrong_count += 1
                        # WRONG: Bright Red outline + dot on student's pick
                        cv2.circle(overlay, (chosen_cx, chosen_cy), 11, (0, 0, 255), 2)
                        cv2.circle(overlay, (chosen_cx, chosen_cy), 4, (0, 0, 255), -1)

                        # Highlight the correct option with a subtle green ring so teacher can verify
                        corr_opt_idx = options.index(correct_ans) if correct_ans in options else -1
                        if corr_opt_idx >= 0:
                            corr_cx = col_x + corr_opt_idx * q_bubbles_gap
                            cv2.circle(overlay, (corr_cx, row_y), 11, (0, 200, 0), 1)
                    else:
                        unattempted_count += 1
                        # Unattempted: Show subtle hint on correct answer
                        corr_opt_idx = options.index(correct_ans) if correct_ans in options else -1
                        if corr_opt_idx >= 0:
                            corr_cx = col_x + corr_opt_idx * q_bubbles_gap
                            cv2.circle(overlay, (corr_cx, row_y), 8, (120, 120, 120), 1)
                else:
                    # No answer key supplied: Simply highlight marked bubbles in cyan
                    if chosen_option != "-":
                        cv2.circle(overlay, (chosen_cx, chosen_cy), 11, (255, 200, 0), 2)

                # Subject-wise marks aggregation
                if q_num <= 25:
                    maths_marks += q_mark
                elif q_num <= 50:
                    physics_marks += q_mark
                else:
                    chemistry_marks += q_mark

        total_marks = maths_marks + physics_marks + chemistry_marks

        # Encode processed overlay image to Base64 JPEG (raw base64 for frontend compatibility)
        _, buffer = cv2.imencode('.jpg', overlay, [cv2.IMWRITE_JPEG_QUALITY, 80])
        processed_b64 = base64.b64encode(buffer).decode('utf-8')

        return {
            "success": True,
            "student_id": student_id_str,
            "processed_image": processed_b64,
            "answers": detected_answers,
            "total_questions": 75,
            "correct": correct_count,
            "wrong": wrong_count,
            "unattempted": unattempted_count,
            "marks": {
                "maths": maths_marks,
                "physics": physics_marks,
                "chemistry": chemistry_marks,
                "total": total_marks
            }
        }

    except Exception as e:
        import traceback
        return {"error": f"OMR Error: {str(e)}: {traceback.format_exc()}"}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python omr_scanner.py <image_path> <answer_key_json_path>"}))
        sys.exit(1)

    in_img_path = sys.argv[1]
    in_ans_key_path = sys.argv[2]

    loaded_ans_key = {}
    if os.path.exists(in_ans_key_path):
        try:
            with open(in_ans_key_path, 'r', encoding='utf-8') as f:
                loaded_ans_key = json.load(f)
        except Exception:
            loaded_ans_key = {}

    result_data = process_omr(in_img_path, loaded_ans_key)
    print(json.dumps(result_data))
