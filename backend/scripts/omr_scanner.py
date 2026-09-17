import cv2
import numpy as np
import sys
import json
import base64


def process_omr(image_path, answer_key):
    try:
        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Could not read image"}

        # Resize to standard size (max 1400px) for consistent grid geometry
        max_dim = 1400
        h0, w0 = image.shape[:2]
        if max(h0, w0) > max_dim:
            scale = max_dim / max(h0, w0)
            image = cv2.resize(image, (int(w0 * scale), int(h0 * scale)), interpolation=cv2.INTER_AREA)

        original_h, original_w = image.shape[:2]

        # --- Step 1: Black Vision Preprocessing ---
        # Paper background becomes Black (0), White filled ink bubbles become White (255)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

        # Base color preview for the UI (The user's requested Black Vision view)
        color_preview = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)

        # --- Step 2: Extract Solid White Filled Bubbles ---
        # Morphological OPEN (Erode + Dilate) removes thin 1-2px text, hollow rings, and grid lines,
        # leaving ONLY solid white filled bubbles intact!
        open_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, open_kernel)

        contours, _ = cv2.findContours(opened, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        total_pixels = original_h * original_w
        min_area = total_pixels * 0.00003   # ~35-50px
        max_area = total_pixels * 0.0035    # ~3500px

        raw_bubbles = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < min_area or area > max_area:
                continue
            x, y, w, h = cv2.boundingRect(cnt)
            aspect = w / h if h > 0 else 0
            if not (0.45 <= aspect <= 2.20):
                continue
            if w < 6 or h < 6 or w > original_w * 0.06 or h > original_h * 0.06:
                continue

            cx = x + w // 2
            cy = y + h // 2

            raw_bubbles.append({
                "cx": cx, "cy": cy,
                "x": x, "y": y, "w": w, "h": h,
                "area": area
            })

        # Deduplicate overlapping or adjacent contour fragments
        min_dist_sq = (original_w * 0.012) ** 2
        filled_bubbles = []
        for b in raw_bubbles:
            dup = False
            for fb in filled_bubbles:
                if (b["cx"] - fb["cx"]) ** 2 + (b["cy"] - fb["cy"]) ** 2 < min_dist_sq:
                    dup = True
                    if b["area"] > fb["area"]:
                        fb.update(b)
                    break
            if not dup:
                filled_bubbles.append(b)

        # --- Step 3: Detect Student ID Bubbles ---
        # Student ID box is located on the top-left portion of the sheet
        id_bubbles = [
            b for b in filled_bubbles
            if (0.12 * original_h <= b["cy"] <= 0.35 * original_h) and
               (0.08 * original_w <= b["cx"] <= 0.36 * original_w)
        ]

        student_id_str = "AUTO_DETECT"
        if id_bubbles:
            # Sort by X coordinate into columns (from left to right)
            id_bubbles.sort(key=lambda b: b["cx"])
            col_gap = original_w * 0.015
            id_cols = []
            curr_col = [id_bubbles[0]]
            for i in range(1, len(id_bubbles)):
                if id_bubbles[i]["cx"] - id_bubbles[i-1]["cx"] > col_gap:
                    id_cols.append(curr_col)
                    curr_col = [id_bubbles[i]]
                else:
                    curr_col.append(id_bubbles[i])
            id_cols.append(curr_col)

            # Keep the 4 digit columns
            target_cols = id_cols[-4:] if len(id_cols) >= 4 else id_cols

            Y_id_start = 0.165 * original_h
            Y_id_end = 0.310 * original_h
            id_step = (Y_id_end - Y_id_start) / 9.0 if Y_id_end > Y_id_start else 1.0

            digits = []
            for col in target_cols:
                # In each column, pick the most prominent bubble
                b = max(col, key=lambda item: item["area"])
                d = int(round((b["cy"] - Y_id_start) / id_step))
                d = min(9, max(0, d))
                digits.append(str(d))

                # Highlight student ID bubble in Bright Blue on Black Vision
                cv2.circle(color_preview, (b["cx"], b["cy"]), 12, (255, 140, 0), 2)
                cv2.circle(color_preview, (b["cx"], b["cy"]), 5, (255, 140, 0), -1)

            detected_code = "".join(digits)
            if len(detected_code) == 4:
                student_id_str = f"JY26-{detected_code}"
            elif len(detected_code) > 0:
                student_id_str = f"JY26-{detected_code.zfill(4)}"

        # --- Step 4: Detect Question Answer Bubbles ---
        # Questions occupy the central grid (below instructions, above marks table)
        q_bubbles = [
            b for b in filled_bubbles
            if (0.40 * original_h <= b["cy"] <= 0.86 * original_h) and
               (0.06 * original_w <= b["cx"] <= 0.95 * original_w)
        ]

        # Grid geometry for the 5 question blocks (15 questions each = 75 questions)
        X_start = 0.075 * original_w
        X_end = 0.935 * original_w
        block_w = (X_end - X_start) / 5.0 if X_end > X_start else original_w / 5.0

        Y_start = 0.440 * original_h
        Y_end = 0.835 * original_h
        row_step = (Y_end - Y_start) / 14.0 if Y_end > Y_start else 1.0

        answers_by_q = {}
        bubbles_by_q = {}

        for b in q_bubbles:
            block_idx = int((b["cx"] - X_start) / block_w)
            block_idx = min(4, max(0, block_idx))

            row_idx = int(round((b["cy"] - Y_start) / row_step))
            row_idx = min(14, max(0, row_idx))

            q_num = block_idx * 15 + row_idx + 1

            # Determine option A, B, C, D within block
            bx_start = X_start + block_idx * block_w
            rel_x = (b["cx"] - bx_start) / block_w

            if rel_x < 0.40:
                opt = "A"
            elif rel_x < 0.60:
                opt = "B"
            elif rel_x < 0.80:
                opt = "C"
            else:
                opt = "D"

            q_str = str(q_num)
            if q_str not in answers_by_q:
                answers_by_q[q_str] = [opt]
                bubbles_by_q[q_str] = [b]
            else:
                answers_by_q[q_str].append(opt)
                bubbles_by_q[q_str].append(b)

        # --- Step 5: Grade Answers against Answer Key & Draw Visual Feedback ---
        detected_answers = {}
        maths = 0
        physics = 0
        chemistry = 0
        correct = 0
        wrong = 0

        for q in range(1, 76):
            q_str = str(q)
            opts = answers_by_q.get(q_str, [])
            bub_list = bubbles_by_q.get(q_str, [])

            if len(opts) == 0:
                ans = "-"
            elif len(opts) == 1:
                ans = opts[0]
            else:
                ans = "DOUBTFUL"

            detected_answers[q_str] = ans
            correct_ans = answer_key.get(q_str)

            # Scoring (+4 for correct, 0 for wrong/unattempted)
            marks = 0
            if correct_ans:
                if ans == correct_ans:
                    marks = 4
                    correct += 1
                    # CORRECT: Bright Green circle around white bubble
                    for b in bub_list:
                        cv2.circle(color_preview, (b["cx"], b["cy"]), 12, (0, 255, 0), 2)
                        cv2.circle(color_preview, (b["cx"], b["cy"]), 5, (0, 255, 0), -1)
                elif ans != "-":
                    marks = 0
                    wrong += 1
                    # WRONG: Bright Red circle around student's white bubble
                    for b in bub_list:
                        cv2.circle(color_preview, (b["cx"], b["cy"]), 12, (0, 0, 255), 2)
                        cv2.circle(color_preview, (b["cx"], b["cy"]), 5, (0, 0, 255), -1)
            else:
                # No answer key available: Highlight marked bubble in cyan
                for b in bub_list:
                    cv2.circle(color_preview, (b["cx"], b["cy"]), 11, (255, 255, 0), 2)

            # Subject breakdown
            if q <= 25:
                maths += marks
            elif q <= 50:
                physics += marks
            else:
                chemistry += marks

        # Encode black vision preview with glowing colored markings
        _, buffer = cv2.imencode('.jpg', color_preview, [cv2.IMWRITE_JPEG_QUALITY, 70])
        processed_b64 = base64.b64encode(buffer).decode('utf-8')

        return {
            "success": True,
            "student_id": student_id_str,
            "processed_image": processed_b64,
            "answers": detected_answers,
            "bubbles_found": len(filled_bubbles),
            "questions_detected": 75,
            "marks": {
                "maths": maths,
                "physics": physics,
                "chemistry": chemistry,
                "total": maths + physics + chemistry
            },
            "total_questions": 75,
            "correct": correct,
            "wrong": wrong
        }

    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments: image_path and answer_key_json_path required"}))
        sys.exit(1)

    img_path = sys.argv[1]
    ans_key_path = sys.argv[2]

    try:
        with open(ans_key_path, 'r') as f:
            ans_key = json.load(f)
    except Exception:
        ans_key = {}

    output = process_omr(img_path, ans_key)
    print(json.dumps(output))

