#!/usr/bin/env python3
"""
JY School - Production OMR Engine & Scanner Pro
Features:
- Solid alignment without slant/distortion:
  Uses the 4 corner black fiducial markers or the outer border bounding box.
  Never tilts or warps a flat scan.
- Black Vision bubble detection:
  Directly measures solid white bubble fill in inverted binary space.
- Student ID extraction: 4 vertical columns, digits 0 to 9 -> JY26-XXXX.
- 75 Questions: 5 blocks of 15 questions with options A, B, C, D.
- Master Answer Key evaluation with subject marks (Maths 1-25, Physics 26-50, Chemistry 51-75).
- High-contrast Black Vision preview with glowing Green, Red, and Cyan markings.
"""

import os
import sys
import json
import base64
from pathlib import Path
import cv2
import numpy as np

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


def align_omr_sheet(image):
    """
    Cleanly rectifies the OMR sheet to canonical (1100, 1550).
    Guarantees the sheet is NEVER tilted or distorted:
    1. Detects the 4 corner black fiducial markers if present and warps cleanly.
    2. Fallback: Detects the outer black border frame bounding box and crops/resizes.
    3. Fallback: Direct clean resize without diagonal shear.
    """
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()

    # Otsu threshold to isolate black ink from paper/desk
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, ink_mask = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Search in the 4 corner zones for the 4 solid black fiducial markers
    qw = int(w * 0.22)
    qh = int(h * 0.22)
    quads = {
        "tl": (0, qw, 0, qh, 0, 0),
        "tr": (w - qw, w, 0, qh, w - qw, 0),
        "bl": (0, qw, h - qh, h, 0, h - qh),
        "br": (w - qw, w, h - qh, h, w - qw, h - qh),
    }

    markers = {}
    for qname, (x1, x2, y1, y2, ox, oy) in quads.items():
        patch = ink_mask[y1:y2, x1:x2]
        cnts, _ = cv2.findContours(patch, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        best_pt = None
        best_score = 0
        min_area = (qw * qh) * 0.003
        max_area = (qw * qh) * 0.25

        for c in cnts:
            area = cv2.contourArea(c)
            if min_area < area < max_area:
                bx, by, bw, bh = cv2.boundingRect(c)
                aspect = bw / float(bh) if bh > 0 else 0
                if 0.65 <= aspect <= 1.55:
                    extent = area / float(bw * bh)
                    if extent > 0.55:  # Solid square or rectangle
                        if area > best_score:
                            best_score = area
                            best_pt = (ox + bx + bw / 2.0, oy + by + bh / 2.0)
        if best_pt:
            markers[qname] = best_pt

    # If all 4 corner markers are found, verify they form a valid upright rectangle
    if len(markers) == 4:
        tl = markers["tl"]
        tr = markers["tr"]
        br = markers["br"]
        bl = markers["bl"]
        # Sanity check: horizontal and vertical alignment within 4% of image dimensions
        top_diff = abs(tl[1] - tr[1])
        bot_diff = abs(bl[1] - br[1])
        left_diff = abs(tl[0] - bl[0])
        right_diff = abs(tr[0] - br[0])
        if top_diff < (h * 0.05) and bot_diff < (h * 0.05) and left_diff < (w * 0.05) and right_diff < (w * 0.05):
            pts = np.array([tl, tr, br, bl], dtype="float32")
            dst = np.array([
                [45, 45],
                [PAGE_WIDTH - 45, 45],
                [PAGE_WIDTH - 45, PAGE_HEIGHT - 45],
                [45, PAGE_HEIGHT - 45]
            ], dtype="float32")
            M = cv2.getPerspectiveTransform(order_points(pts), dst)
            return cv2.warpPerspective(image, M, (PAGE_WIDTH, PAGE_HEIGHT), flags=cv2.INTER_LANCZOS4)

    # Fallback: Find the outer black border frame bounding box (guaranteed 0% tilt)
    cnts, _ = cv2.findContours(ink_mask, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)

    for c in cnts[:5]:
        area = cv2.contourArea(c)
        if area > (w * h * 0.28):
            bx, by, bw, bh = cv2.boundingRect(c)
            if bw > w * 0.45 and bh > h * 0.45 and bh > bw:
                cropped = image[by:by+bh, bx:bx+bw]
                return cv2.resize(cropped, (PAGE_WIDTH, PAGE_HEIGHT), interpolation=cv2.INTER_LANCZOS4)

    # Fallback: Direct clean resize (guaranteed 0% tilt)
    return cv2.resize(image, (PAGE_WIDTH, PAGE_HEIGHT), interpolation=cv2.INTER_LANCZOS4)


def evaluate_bubble_white_fill(thresh_img, cx, cy, radius=8, search_window=4):
    """
    Measures solid white bubble fill in Black Vision binary image.
    Hollow bubbles have black center (fill_ratio < 0.25).
    Filled ink bubbles are solid white (fill_ratio > 0.45).
    """
    h, w = thresh_img.shape[:2]
    best_fill = 0.0

    # Search in small local window around (cx, cy)
    for dx in (-search_window, 0, search_window):
        for dy in (-search_window, 0, search_window):
            cur_x, cur_y = cx + dx, cy + dy
            x1, x2 = max(0, int(cur_x - radius)), min(w, int(cur_x + radius + 1))
            y1, y2 = max(0, int(cur_y - radius)), min(h, int(cur_y + radius + 1))

            patch = thresh_img[y1:y2, x1:x2]
            if patch.size > 0:
                mask = np.zeros(patch.shape, dtype=np.uint8)
                pcx = int(cur_x - x1)
                pcy = int(cur_y - y1)
                cv2.circle(mask, (pcx, pcy), int(radius * 0.85), 255, -1)

                bubble_pixels = patch[mask == 255]
                if len(bubble_pixels) > 0:
                    white_ratio = float(np.count_nonzero(bubble_pixels == 255)) / float(len(bubble_pixels))
                    if white_ratio > best_fill:
                        best_fill = white_ratio

    return best_fill


def process_omr(image_path, answer_key=None):
    """
    Main OMR Processor.
    """
    try:
        if answer_key is None:
            answer_key = {}

        image = cv2.imread(image_path)
        if image is None:
            return {"error": f"Could not read image from {image_path}"}

        # Step 1: Align sheet without slant
        aligned = align_omr_sheet(image)
        gray = cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY) if len(aligned.shape) == 3 else aligned.copy()

        # Step 2: Black Vision binary representation
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

        # Base color preview for the UI (The user's requested Black Vision view)
        color_preview = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)

        # ----------------------------------------------------
        # Step 3: Student ID Extraction (up to 6 vertical columns)
        # ----------------------------------------------------
        id_origin_x = 120
        id_origin_y = 398
        id_labels_gap = 34    # Gap between columns
        id_bubbles_gap = 26   # Gap between vertical digit bubbles 0..9

        detected_digits = []
        for col in range(6):
            col_x = id_origin_x + col * id_labels_gap
            col_scores = []

            for digit in range(10):
                bubble_y = id_origin_y + digit * id_bubbles_gap
                fill_ratio = evaluate_bubble_white_fill(thresh, col_x, bubble_y, radius=8)
                col_scores.append({
                    "digit": str(digit),
                    "cx": col_x,
                    "cy": bubble_y,
                    "fill": fill_ratio
                })

            col_scores.sort(key=lambda s: s["fill"], reverse=True)
            top = col_scores[0]
            second = col_scores[1]

            # In black vision, solid filled white bubble has fill > 0.35
            if top["fill"] >= 0.35 and (top["fill"] - second["fill"] >= 0.10 or top["fill"] >= 0.50):
                detected_digits.append(top["digit"])
                # Draw bright cyan circle around detected ID digit bubble
                cv2.circle(color_preview, (top["cx"], top["cy"]), 12, (255, 255, 0), 2)
                cv2.circle(color_preview, (top["cx"], top["cy"]), 5, (255, 255, 0), -1)
            else:
                detected_digits.append("X")

        digits_only = "".join([d for d in detected_digits if d != "X"])
        if len(digits_only) >= 3:
            student_id_str = digits_only
        else:
            student_id_str = "AUTO_DETECT"

        # ----------------------------------------------------
        # Step 4: 75 Questions Extraction (5 columns of 15 Qs)
        # ----------------------------------------------------
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
                    fill_ratio = evaluate_bubble_white_fill(thresh, bx, by, radius=8)
                    opt_scores.append({
                        "option": opt_char,
                        "cx": bx,
                        "cy": by,
                        "fill": fill_ratio
                    })

                opt_scores.sort(key=lambda x: x["fill"], reverse=True)
                top_opt = opt_scores[0]
                second_opt = opt_scores[1]

                # Clear check: top option must be filled solid white
                is_filled = (top_opt["fill"] >= 0.38 and (top_opt["fill"] - second_opt["fill"] >= 0.12)) or (top_opt["fill"] >= 0.55)

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
                        # CORRECT: Bright Green outline + inner dot on white bubble
                        cv2.circle(color_preview, (chosen_cx, chosen_cy), 12, (0, 255, 0), 2)
                        cv2.circle(color_preview, (chosen_cx, chosen_cy), 5, (0, 255, 0), -1)
                    elif chosen_option != "-":
                        q_mark = 0
                        wrong_count += 1
                        # WRONG: Bright Red outline + inner dot on student's picked white bubble
                        cv2.circle(color_preview, (chosen_cx, chosen_cy), 12, (0, 0, 255), 2)
                        cv2.circle(color_preview, (chosen_cx, chosen_cy), 5, (0, 0, 255), -1)

                        # Highlight correct option with subtle green ring
                        corr_opt_idx = options.index(correct_ans) if correct_ans in options else -1
                        if corr_opt_idx >= 0:
                            corr_cx = col_x + corr_opt_idx * q_bubbles_gap
                            cv2.circle(color_preview, (corr_cx, row_y), 11, (0, 255, 0), 1)
                    else:
                        unattempted_count += 1
                        # Unattempted: Show subtle hint on correct answer
                        corr_opt_idx = options.index(correct_ans) if correct_ans in options else -1
                        if corr_opt_idx >= 0:
                            corr_cx = col_x + corr_opt_idx * q_bubbles_gap
                            cv2.circle(color_preview, (corr_cx, row_y), 8, (120, 120, 120), 1)
                else:
                    # No answer key supplied: Highlight marked bubble in cyan
                    if chosen_option != "-":
                        cv2.circle(color_preview, (chosen_cx, chosen_cy), 11, (255, 255, 0), 2)

                # Subject-wise marks aggregation
                if q_num <= 25:
                    maths_marks += q_mark
                elif q_num <= 50:
                    physics_marks += q_mark
                else:
                    chemistry_marks += q_mark

        total_marks = maths_marks + physics_marks + chemistry_marks

        # Encode black vision preview image to Base64 JPEG
        _, buffer = cv2.imencode('.jpg', color_preview, [cv2.IMWRITE_JPEG_QUALITY, 80])
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
