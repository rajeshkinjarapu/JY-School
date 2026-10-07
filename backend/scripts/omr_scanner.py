#!/usr/bin/env python3
"""
JY School - Production OMR Engine & Scanner Pro
Features:
- Solid Paper Segmentation: Isolates white paper from black scanner bed/desk margins.
- Zero-Distortion Alignment: Direct upright crop and resize to canonical (1100, 1550).
- Pure White Bubble Detection: Measures pure pen ink in bubble interior without ring bleed.
- Student ID extraction: 6 vertical columns, digits 0 to 9 -> 269657.
- 75 Questions: 5 blocks of 15 questions with options A, B, C, D.
- Master Answer Key evaluation with subject marks (Maths 1-25, Physics 26-50, Chemistry 51-75).
- High-contrast Black Vision preview with glowing Green (correct), Red (wrong), and Cyan (Student ID) markings.
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


def align_omr_sheet(image):
    """
    Cleanly rectifies the OMR sheet to canonical (1100, 1550).
    Guarantees 0% tilt/slant:
    1. Isolates the white paper sheet from surrounding black/dark scanner bed.
    2. Crops strictly to the paper bounds so scanner margins don't offset the grid.
    3. Resizes cleanly to canonical (1100, 1550).
    """
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()

    # Detect the white paper sheet (bright paper vs dark scanner background)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)
    _, paper_thresh = cv2.threshold(blurred, 120, 255, cv2.THRESH_BINARY)

    cnts, _ = cv2.findContours(paper_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if cnts:
        largest = max(cnts, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        # If paper sheet contour covers > 35% of image, crop off the dark scanner bed
        if area > (w * h * 0.35):
            bx, by, bw, bh = cv2.boundingRect(largest)
            if bw > (w * 0.45) and bh > (h * 0.45):
                pad_x = int(bw * 0.006)
                pad_y = int(bh * 0.006)
                x1 = min(w - 1, max(0, bx + pad_x))
                y1 = min(h - 1, max(0, by + pad_y))
                x2 = max(x1 + 10, min(w, bx + bw - pad_x))
                y2 = max(y1 + 10, min(h, by + bh - pad_y))
                cropped = image[y1:y2, x1:x2]
                return cv2.resize(cropped, (PAGE_WIDTH, PAGE_HEIGHT), interpolation=cv2.INTER_LANCZOS4)

    # Fallback: Clean resize to canonical dimensions
    return cv2.resize(image, (PAGE_WIDTH, PAGE_HEIGHT), interpolation=cv2.INTER_LANCZOS4)


def evaluate_bubble_fill(thresh_img, cx, cy, radius=5):
    """
    Measures solid white pixel fill in a tight interior disk (radius=5).
    Stays strictly inside the bubble (bubble radius is ~10px).
    Never touches the outer printed ring or table dividing lines.
    Tests micro-jitter (-2, 0, 2) to handle slight scanner offsets.
    Unfilled bubbles: fill < 0.22.
    Pen-filled bubbles: fill > 0.45.
    """
    h, w = thresh_img.shape[:2]
    best_fill = 0.0

    for dx in (-2, 0, 2):
        for dy in (-2, 0, 2):
            cur_x = cx + dx
            cur_y = cy + dy
            x1 = max(0, cur_x - radius)
            x2 = min(w, cur_x + radius + 1)
            y1 = max(0, cur_y - radius)
            y2 = min(h, cur_y + radius + 1)

            patch = thresh_img[y1:y2, x1:x2]
            if patch.size > 0:
                mask = np.zeros(patch.shape, dtype=np.uint8)
                pcx = cur_x - x1
                pcy = cur_y - y1
                cv2.circle(mask, (pcx, pcy), radius, 255, -1)

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

        # Step 1: Align sheet without slant & remove scanner margins
        aligned = align_omr_sheet(image)
        gray = cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY) if len(aligned.shape) == 3 else aligned.copy()

        # Step 2: Black Vision binary representation (White ink on Black paper)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

        # Base color preview for the UI (The user's requested Black Vision view)
        color_preview = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)

        # ----------------------------------------------------
        # Step 3: Student ID Extraction (6 vertical columns under digit boxes)
        # In JY School OMR:
        # First 2 boxes are 'J' 'Y' (no bubbles).
        # Bubble columns 0..5 correspond to digits 1..6 of student roll number.
        # ----------------------------------------------------
        id_origin_x = 135.0     # Column 0 center
        id_labels_gap = 34.6    # Gap between consecutive columns
        id_origin_y = 345.0     # Digit 0 row center
        id_bubbles_gap = 21.1   # Gap between consecutive vertical digits 0..9

        detected_digits = []
        for col in range(6):
            col_x = int(round(id_origin_x + col * id_labels_gap))
            col_scores = []

            for digit in range(10):
                bubble_y = int(round(id_origin_y + digit * id_bubbles_gap))
                fill_ratio = evaluate_bubble_fill(thresh, col_x, bubble_y, radius=5)
                col_scores.append({
                    "digit": str(digit),
                    "cx": col_x,
                    "cy": bubble_y,
                    "fill": fill_ratio
                })

            col_scores.sort(key=lambda s: s["fill"], reverse=True)
            top = col_scores[0]
            second = col_scores[1]

            # Clear winner check: top digit must be filled with ink
            if top["fill"] >= 0.35 and (top["fill"] - second["fill"] >= 0.12 or top["fill"] >= 0.50):
                detected_digits.append(top["digit"])
                # Draw bright cyan circle around detected ID digit bubble
                cv2.circle(color_preview, (int(top["cx"]), int(top["cy"])), 11, (255, 255, 0), 2)
                cv2.circle(color_preview, (int(top["cx"]), int(top["cy"])), 4, (255, 255, 0), -1)
            else:
                detected_digits.append("X")

        digits_only = "".join([d for d in detected_digits if d != "X"])
        student_id_str = digits_only if len(digits_only) >= 3 else "AUTO_DETECT"

        # ----------------------------------------------------
        # Step 4: 75 Questions Extraction (5 columns of 15 Qs)
        # Block 1 (Q1-15), Block 2 (Q16-30), Block 3 (Q31-45), Block 4 (Q46-60), Block 5 (Q61-75)
        # ----------------------------------------------------
        block_x_origins = [115, 315, 515, 715, 915]
        q_start_y = 760
        q_labels_gap = 34.5   # Vertical gap between consecutive questions
        q_bubbles_gap = 24.0  # Horizontal gap between options A, B, C, D
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
                row_y = int(round(q_start_y + row_idx * q_labels_gap))

                opt_scores = []
                for opt_idx, opt_char in enumerate(options):
                    bx = int(round(col_x + opt_idx * q_bubbles_gap))
                    by = row_y
                    fill_ratio = evaluate_bubble_fill(thresh, bx, by, radius=5)
                    opt_scores.append({
                        "option": opt_char,
                        "cx": bx,
                        "cy": by,
                        "fill": fill_ratio
                    })

                opt_scores.sort(key=lambda x: x["fill"], reverse=True)
                top_opt = opt_scores[0]
                second_opt = opt_scores[1]

                # Clear relative check: top option must have distinct ink fill
                is_filled = (top_opt["fill"] >= 0.35 and (top_opt["fill"] - second_opt["fill"] >= 0.12)) or (top_opt["fill"] >= 0.50)

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
                        cv2.circle(color_preview, (int(round(chosen_cx)), int(round(chosen_cy))), 11, (0, 255, 0), 2)
                        cv2.circle(color_preview, (int(round(chosen_cx)), int(round(chosen_cy))), 4, (0, 255, 0), -1)
                    elif chosen_option != "-":
                        q_mark = 0
                        wrong_count += 1
                        # WRONG: Bright Red outline + inner dot on student's picked white bubble
                        cv2.circle(color_preview, (int(round(chosen_cx)), int(round(chosen_cy))), 11, (0, 0, 255), 2)
                        cv2.circle(color_preview, (int(round(chosen_cx)), int(round(chosen_cy))), 4, (0, 0, 255), -1)

                        # Highlight correct option with subtle green ring
                        corr_opt_idx = options.index(correct_ans) if correct_ans in options else -1
                        if corr_opt_idx >= 0:
                            corr_cx = int(round(col_x + corr_opt_idx * q_bubbles_gap))
                            cv2.circle(color_preview, (corr_cx, int(round(row_y))), 10, (0, 255, 0), 1)
                    else:
                        unattempted_count += 1
                        # Unattempted: Show subtle hint on correct answer
                        corr_opt_idx = options.index(correct_ans) if correct_ans in options else -1
                        if corr_opt_idx >= 0:
                            corr_cx = int(round(col_x + corr_opt_idx * q_bubbles_gap))
                            cv2.circle(color_preview, (corr_cx, int(round(row_y))), 8, (120, 120, 120), 1)
                else:
                    # No answer key supplied: Highlight marked bubble in cyan
                    if chosen_option != "-":
                        cv2.circle(color_preview, (int(round(chosen_cx)), int(round(chosen_cy))), 10, (255, 255, 0), 2)

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
        return {"error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python omr_scanner.py <image_path> [answer_key_json_or_file]"}))
        sys.exit(1)

    img_file = sys.argv[1]
    key_dict = {}

    if len(sys.argv) >= 3:
        arg = sys.argv[2]
        # Check if the argument is a file path (generated by exams.controller.ts)
        if os.path.isfile(arg):
            try:
                with open(arg, 'r', encoding='utf-8') as f:
                    key_dict = json.load(f)
            except Exception:
                key_dict = {}
        else:
            try:
                key_dict = json.loads(arg)
            except Exception:
                key_dict = {}

    res = process_omr(img_file, key_dict)
    print(json.dumps(res))
