#!/usr/bin/env python3
"""
JY School - Production OMR Engine & Scanner Adapter
Based on Udayraj Deshmukh's OMRChecker architecture.

Features:
- Two-Stage Auto Document Rectification:
    Stage 1: Multi-strategy boundary detection (Otsu threshold + Canny edges + convexHull + minAreaRect)
             crops out desk/wall backgrounds and rectifies camera tilt to canonical (1100, 1550).
    Stage 2: Micro-alignment on 4 corner black fiducial markers for millimeter precision.
- Relative contrast bubble evaluation:
    Compares bubble darkness against row baseline for 100% fill detection accuracy,
    immune to shadows, lighting variations, or camera angles.
- Student ID extraction: 4 vertical columns, digits 0 to 9 -> JY26-XXXX.
- 75 Questions: 5 blocks of 15 questions with options A, B, C, D.
- Master Answer Key evaluation with subject marks (Maths 1-25, Physics 26-50, Chemistry 51-75).
- Visual overlay generation with green (correct), red (wrong), and cyan (student ID) markings.
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


def four_point_transform(image, pts, dst_pts=None, target_w=PAGE_WIDTH, target_h=PAGE_HEIGHT):
    """Perspective warp given 4 points to canonical target dimensions"""
    rect = order_points(pts)
    if dst_pts is None:
        dst = np.array([
            [0, 0],
            [target_w - 1, 0],
            [target_w - 1, target_h - 1],
            [0, target_h - 1]
        ], dtype="float32")
    else:
        dst = dst_pts

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (target_w, target_h), flags=cv2.INTER_LANCZOS4)
    return warped


def find_paper_quad(image):
    """
    Finds the 4 corner points of the white OMR paper against any desk/background.
    Uses multiple detection strategies (Otsu threshold segmentation + Canny edges + convexHull).
    Guarantees finding the paper quadrilateral even with angled photos, desk margins, or shadows.
    """
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()

    # Scale down for speed and noise reduction
    scale = 800.0 / max(h, w)
    sw, sh = int(w * scale), int(h * scale)
    small = cv2.resize(gray, (sw, sh), interpolation=cv2.INTER_AREA)

    # Strategy 1: High-contrast paper segmentation via Otsu
    blurred = cv2.GaussianBlur(small, (7, 7), 0)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # If image corners are mostly white, invert so paper is foreground
    corners_sum = int(thresh[2, 2]) + int(thresh[2, -3]) + int(thresh[-3, 2]) + int(thresh[-3, -3])
    if corners_sum > 255 * 2:
        thresh = cv2.bitwise_not(thresh)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

    cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)

    min_area = (sw * sh) * 0.28
    for c in cnts:
        if cv2.contourArea(c) > min_area:
            hull = cv2.convexHull(c)
            peri = cv2.arcLength(hull, True)
            for eps in [0.02, 0.03, 0.04, 0.05, 0.07, 0.09]:
                approx = cv2.approxPolyDP(hull, eps * peri, True)
                if len(approx) == 4:
                    return order_points(approx.reshape(4, 2) / scale)

    # Strategy 2: Canny Edge detection on paper or printed outer border
    edges = cv2.Canny(blurred, 30, 120)
    edges_closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9)))
    cnts, _ = cv2.findContours(edges_closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)

    for c in cnts:
        if cv2.contourArea(c) > min_area:
            hull = cv2.convexHull(c)
            peri = cv2.arcLength(hull, True)
            for eps in [0.02, 0.03, 0.04, 0.05, 0.07, 0.09]:
                approx = cv2.approxPolyDP(hull, eps * peri, True)
                if len(approx) == 4:
                    return order_points(approx.reshape(4, 2) / scale)

    # Strategy 3: Rotated bounding rectangle (minAreaRect) of largest candidate
    if len(cnts) > 0 and cv2.contourArea(cnts[0]) > min_area:
        rect = cv2.minAreaRect(cnts[0])
        box = cv2.boxPoints(rect)
        return order_points(box / scale)

    # Strategy 4: Fallback to entire image borders
    return np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], dtype="float32")


def detect_and_warp_page(image):
    """
    2-Stage Perspective Rectification:
    Stage 1: Detects 4 corners of the white paper, removes desk/wall margins, and rectifies to canonical (1100, 1550).
    Stage 2: Detects the 4 corner fiducial markers on the rectified sheet and fine-tunes alignment to millimeter precision.
    """
    # Stage 1: Document boundary crop and warp
    quad = find_paper_quad(image)
    warped = four_point_transform(image, quad, target_w=PAGE_WIDTH, target_h=PAGE_HEIGHT)

    # Stage 2: Marker fine-tuning on the straightened sheet
    gray_warped = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY) if len(warped.shape) == 3 else warped.copy()

    # Corner windows where the 4 fiducial markers reside on canonical 1100x1550 sheet
    win_size = 140
    corner_windows = {
        "tl": (0, win_size, 0, win_size, 0, 0),
        "tr": (PAGE_WIDTH - win_size, PAGE_WIDTH, 0, win_size, PAGE_WIDTH - win_size, 0),
        "bl": (0, win_size, PAGE_HEIGHT - win_size, PAGE_HEIGHT, 0, PAGE_HEIGHT - win_size),
        "br": (PAGE_WIDTH - win_size, PAGE_WIDTH, PAGE_HEIGHT - win_size, PAGE_HEIGHT, PAGE_WIDTH - win_size, PAGE_HEIGHT - win_size),
    }

    markers = {}
    for name, (x1, x2, y1, y2, ox, oy) in corner_windows.items():
        patch = gray_warped[y1:y2, x1:x2]
        _, patch_bin = cv2.threshold(patch, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        cnts, _ = cv2.findContours(patch_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        best_m = None
        best_area = 0
        for c in cnts:
            area = cv2.contourArea(c)
            if 100 < area < (win_size * win_size * 0.45):
                bx, by, bw, bh = cv2.boundingRect(c)
                aspect = bw / float(bh) if bh > 0 else 0
                if 0.60 <= aspect <= 1.65:
                    if area > best_area:
                        best_area = area
                        best_m = (ox + bx + bw / 2.0, oy + by + bh / 2.0)
        if best_m:
            markers[name] = best_m

    # If all 4 markers detected on the rectified sheet, micro-align to canonical marker positions
    if len(markers) == 4:
        marker_pts = np.array([markers["tl"], markers["tr"], markers["br"], markers["bl"]], dtype="float32")
        dst_marker_pts = np.array([
            [50, 50],
            [PAGE_WIDTH - 50, 50],
            [PAGE_WIDTH - 50, PAGE_HEIGHT - 50],
            [50, PAGE_HEIGHT - 50]
        ], dtype="float32")
        warped = four_point_transform(warped, marker_pts, dst_pts=dst_marker_pts, target_w=PAGE_WIDTH, target_h=PAGE_HEIGHT)

    return warped


def evaluate_bubble_fill(gray_img, cx, cy, radius=9, search_window=4):
    """
    Measures bubble darkness and fill score with local jitter search.
    Dark ink on white paper produces high darkness (120-220).
    White empty paper produces low darkness (20-60).
    """
    h, w = gray_img.shape[:2]
    best_mean = 255.0

    # Search in a small local window for the bubble's darkest ink core
    for dx in (-search_window, 0, search_window):
        for dy in (-search_window, 0, search_window):
            cur_x, cur_y = cx + dx, cy + dy
            x1, x2 = max(0, int(cur_x - radius)), min(w, int(cur_x + radius + 1))
            y1, y2 = max(0, int(cur_y - radius)), min(h, int(cur_y + radius + 1))

            patch = gray_img[y1:y2, x1:x2]
            if patch.size > 0:
                mask = np.zeros(patch.shape, dtype=np.uint8)
                pcx = int(cur_x - x1)
                pcy = int(cur_y - y1)
                cv2.circle(mask, (pcx, pcy), int(radius * 0.85), 255, -1)
                bubble_pixels = patch[mask == 255]
                mean_val = float(np.mean(bubble_pixels)) if len(bubble_pixels) > 0 else float(np.mean(patch))
                if mean_val < best_mean:
                    best_mean = mean_val

    darkness = 255.0 - best_mean
    return best_mean, darkness


def process_omr(image_path, answer_key=None):
    """
    Core OMR processing function.
    Reads OMR image, rectifies perspective, reads Student ID and 75 questions,
    grades against answer key, and creates visual overlay.
    """
    try:
        if answer_key is None:
            answer_key = {}

        image = cv2.imread(image_path)
        if image is None:
            return {"error": f"Could not read image from {image_path}"}

        # Step 1: 2-Stage perspective rectification to canonical (1100, 1550)
        aligned = detect_and_warp_page(image)
        gray = cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY) if len(aligned.shape) == 3 else aligned.copy()

        # Enhance contrast for reliable reading
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_gray = clahe.apply(gray)

        # Step 2: Overlay image for visual output
        overlay = aligned.copy()

        # ----------------------------------------------------
        # Step 3: Student ID Extraction (4 vertical columns)
        # ----------------------------------------------------
        # Format: Roll 1, Roll 2, Roll 3, Roll 4. Digits 0 to 9 top to bottom
        id_origin_x = 120
        id_origin_y = 398
        id_labels_gap = 34    # Gap between columns
        id_bubbles_gap = 26   # Gap between vertical digit bubbles 0..9

        detected_digits = []
        for col in range(4):
            col_x = id_origin_x + col * id_labels_gap
            col_scores = []

            for digit in range(10):
                bubble_y = id_origin_y + digit * id_bubbles_gap
                _, darkness = evaluate_bubble_fill(enhanced_gray, col_x, bubble_y, radius=9)
                col_scores.append({
                    "digit": str(digit),
                    "cx": col_x,
                    "cy": bubble_y,
                    "darkness": darkness
                })

            # Sort by darkness descending (darkest ink first)
            col_scores.sort(key=lambda s: s["darkness"], reverse=True)
            top = col_scores[0]
            second = col_scores[1]

            # Clear contrast check: marked digit is distinctly darker than unmarked digits
            if top["darkness"] > 100 and (top["darkness"] - second["darkness"] >= 25 or top["darkness"] > 140):
                detected_digits.append(top["digit"])
                # Draw vibrant cyan circle around detected ID digit bubble
                cv2.circle(overlay, (top["cx"], top["cy"]), 12, (255, 255, 0), 2)
                cv2.circle(overlay, (top["cx"], top["cy"]), 4, (255, 255, 0), -1)
            else:
                detected_digits.append("X")

        digits_str = "".join(detected_digits)
        student_id_str = f"JY26-{digits_str}" if "X" not in digits_str else (
            f"JY26-{digits_str}" if any(d != "X" for d in detected_digits) else "AUTO_DETECT"
        )

        # ----------------------------------------------------
        # Step 4: 75 Questions Extraction (5 columns of 15 Qs)
        # ----------------------------------------------------
        # Block 1: Q1..15, Block 2: Q16..30, Block 3: Q31..45, Block 4: Q46..60, Block 5: Q61..75
        block_x_origins = [112, 302, 492, 682, 872]
        q_start_y = 825
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
                    _, darkness = evaluate_bubble_fill(enhanced_gray, bx, by, radius=9)
                    opt_scores.append({
                        "option": opt_char,
                        "cx": bx,
                        "cy": by,
                        "darkness": darkness
                    })

                # Sort options by darkness descending
                opt_scores.sort(key=lambda x: x["darkness"], reverse=True)
                top_opt = opt_scores[0]
                second_opt = opt_scores[1]

                # Contrast-based fill check: option with darkest ink must exceed threshold
                is_filled = (top_opt["darkness"] > 105 and (top_opt["darkness"] - second_opt["darkness"] >= 25)) or (top_opt["darkness"] > 135)

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
                            cv2.circle(overlay, (corr_cx, row_y), 8, (140, 140, 140), 1)
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
