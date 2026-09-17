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

        # Resize large images to max 1400px wide to keep output size small and fast
        max_dim = 1400
        h0, w0 = image.shape[:2]
        if max(h0, w0) > max_dim:
            scale = max_dim / max(h0, w0)
            image = cv2.resize(image, (int(w0 * scale), int(h0 * scale)), interpolation=cv2.INTER_AREA)

        original_h, original_w = image.shape[:2]

        # --- Step 1: Preprocess ---
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

        # Use a small 3x3 close kernel to seal 1-2 pixel breaks in thin rings
        # without merging neighboring bubbles into horizontal lines
        small_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, small_kernel)

        # --- Step 2: Find all bubble contours ---
        # Use cv2.RETR_LIST instead of RETR_EXTERNAL so outer black sheet borders
        # do not swallow/hide interior bubbles!
        contours, _ = cv2.findContours(closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        total_pixels = original_h * original_w
        min_area = total_pixels * 0.00002   # ~25-40px for small bubbles
        max_area = total_pixels * 0.0035    # ~3500px

        bubbles = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < min_area or area > max_area:
                continue
            perimeter = cv2.arcLength(cnt, True)
            if perimeter == 0:
                continue
            circularity = 4 * np.pi * area / (perimeter * perimeter)
            if circularity < 0.18:
                continue
            x, y, w, h = cv2.boundingRect(cnt)
            aspect = w / h if h > 0 else 0
            if not (0.45 <= aspect <= 2.20):
                continue
            if w < 6 or h < 6 or w > original_w * 0.06 or h > original_h * 0.06:
                continue

            cx = x + w // 2
            cy = y + h // 2

            # Measure fill ratio on thresh
            roi = thresh[y:y+h, x:x+w]
            filled_ratio = cv2.countNonZero(roi) / (w * h) if (w * h) > 0 else 0
            bubbles.append({
                "cx": cx, "cy": cy,
                "x": x, "y": y, "w": w, "h": h,
                "area": area,
                "filled_ratio": filled_ratio,
                "is_filled": filled_ratio > 0.28
            })

        # Deduplicate nested/concentric contours (e.g. inner and outer edges of hollow rings)
        deduped = []
        min_d2 = (original_w * 0.008) ** 2
        for b in bubbles:
            dup = False
            for db in deduped:
                if (b["cx"] - db["cx"]) ** 2 + (b["cy"] - db["cy"]) ** 2 < min_d2:
                    dup = True
                    if b["area"] > db["area"]:
                        db.update(b)
                    break
            if not dup:
                deduped.append(b)
        bubbles = deduped

        # --- Step 3: Region Splitting (Student ID vs Questions) ---
        # Student ID box: left side (X: 5%-40%, Y: 10%-36%)
        id_bubbles = [
            b for b in bubbles
            if (0.10 * original_h <= b["cy"] <= 0.36 * original_h) and
               (0.05 * original_w <= b["cx"] <= 0.40 * original_w)
        ]

        # Questions: from below instructions to above bottom marks table (Y: 38%-88%)
        q_bubbles = [
            b for b in bubbles
            if (0.38 * original_h <= b["cy"] <= 0.88 * original_h) and
               (0.04 * original_w <= b["cx"] <= 0.96 * original_w)
        ]

        # Prepare color preview directly on the original paper image
        color_preview = image.copy()

        # --- Step 4: Parse Student ID ---
        student_id_str = "AUTO_DETECT"
        if len(id_bubbles) >= 4:
            # Draw all ID bubbles in subtle blue
            for b in id_bubbles:
                cv2.rectangle(color_preview, (b["x"], b["y"]), (b["x"]+b["w"], b["y"]+b["h"]), (255, 150, 0), 1)

            # Cluster ID bubbles into vertical columns based on X
            id_bubbles_sorted = sorted(id_bubbles, key=lambda b: b["cx"])
            col_gap = original_w * 0.015
            id_cols = []
            curr_col = [id_bubbles_sorted[0]]
            for i in range(1, len(id_bubbles_sorted)):
                if id_bubbles_sorted[i]["cx"] - id_bubbles_sorted[i-1]["cx"] > col_gap:
                    id_cols.append(curr_col)
                    curr_col = [id_bubbles_sorted[i]]
                else:
                    curr_col.append(id_bubbles_sorted[i])
            id_cols.append(curr_col)

            # Filter columns that have at least 3 bubbles
            valid_id_cols = [c for c in id_cols if len(c) >= 3]
            valid_id_cols.sort(key=lambda c: np.mean([b["cx"] for b in c]))

            # We need the 4 digit columns (take the last 4 if there are extra)
            target_cols = valid_id_cols[-4:] if len(valid_id_cols) >= 4 else valid_id_cols

            digits = []
            for col in target_cols:
                col.sort(key=lambda b: b["cy"])
                max_b = max(col, key=lambda b: b["filled_ratio"])
                min_b = min(col, key=lambda b: b["filled_ratio"])

                if max_b["filled_ratio"] > 0.25 and (max_b["filled_ratio"] > min_b["filled_ratio"] + 0.08 or max_b["filled_ratio"] > 0.35):
                    # Highlight filled ID bubble in solid blue
                    cv2.rectangle(color_preview, (max_b["x"], max_b["y"]), (max_b["x"]+max_b["w"], max_b["y"]+max_b["h"]), (255, 100, 0), -1)

                    if len(col) == 10:
                        d = col.index(max_b)
                    else:
                        min_y = col[0]["cy"]
                        max_y = col[-1]["cy"]
                        step_y = (max_y - min_y) / 9.0 if max_y > min_y else 1
                        d = int(round((max_b["cy"] - min_y) / step_y))
                        if not (0 <= d <= 9):
                            d = col.index(max_b)
                    digits.append(str(d))
                else:
                    digits.append("X")

            detected_code = "".join(digits)
            if len(detected_code) == 4 and "X" not in detected_code:
                student_id_str = f"JY26-{detected_code}"
            elif len(detected_code) >= 4:
                clean = detected_code.replace("X", "0")
                student_id_str = f"JY26-{clean[-4:]}"

        # --- Step 5: Check Question Bubbles ---
        if not q_bubbles:
            # Fallback: encode color preview
            _, buffer = cv2.imencode('.jpg', color_preview, [cv2.IMWRITE_JPEG_QUALITY, 65])
            processed_b64 = base64.b64encode(buffer).decode('utf-8')
            return {
                "error": f"No question bubbles detected. (Total contours: {len(contours)}, Candidates: {len(bubbles)}, ID bubbles: {len(id_bubbles)}). Ensure scanning area is clear.",
                "processed_image": processed_b64
            }

        # --- Step 6: Split Questions into 5 Blocks (15 questions each = 75 questions) ---
        min_qx = min(b["cx"] for b in q_bubbles)
        max_qx = max(b["cx"] for b in q_bubbles)
        span_qx = max_qx - min_qx
        block_w = span_qx / 5.0 if span_qx > 0 else original_w / 5.0

        blocks = [[] for _ in range(5)]
        for b in q_bubbles:
            idx = int((b["cx"] - min_qx) / block_w)
            idx = min(4, max(0, idx))
            blocks[idx].append(b)

        detected_answers = {}
        maths = 0
        physics = 0
        chemistry = 0
        correct = 0
        wrong = 0
        option_labels = ["A", "B", "C", "D"]

        total_questions_processed = 0

        for block_idx in range(5):
            block_bubbles = blocks[block_idx]
            if not block_bubbles:
                for r in range(15):
                    q_num = block_idx * 15 + r + 1
                    detected_answers[str(q_num)] = "-"
                    total_questions_processed = max(total_questions_processed, q_num)
                continue

            # Group bubbles in this block into rows (15 questions)
            block_bubbles.sort(key=lambda b: b["cy"])
            row_gap = original_h * 0.011
            row_clusters = []
            curr_row = [block_bubbles[0]]
            for i in range(1, len(block_bubbles)):
                if block_bubbles[i]["cy"] - block_bubbles[i-1]["cy"] > row_gap:
                    row_clusters.append(curr_row)
                    curr_row = [block_bubbles[i]]
                else:
                    curr_row.append(block_bubbles[i])
            row_clusters.append(curr_row)

            # Sort clusters vertically by Y
            row_clusters.sort(key=lambda rc: np.mean([b["cy"] for b in rc]))

            # Process 15 rows for this block
            for r_idx in range(15):
                q_num = block_idx * 15 + r_idx + 1
                total_questions_processed = max(total_questions_processed, q_num)

                if r_idx >= len(row_clusters):
                    detected_answers[str(q_num)] = "-"
                    continue

                row_b = row_clusters[r_idx]
                row_b.sort(key=lambda b: b["cx"])

                # Find filled options
                ratios = [b["filled_ratio"] for b in row_b]
                max_ratio = max(ratios) if ratios else 0
                min_ratio = min(ratios) if ratios else 0

                filled_candidates = [
                    b for b in row_b
                    if b["filled_ratio"] > 0.26 and (b["filled_ratio"] > min_ratio + 0.10 or b["filled_ratio"] > 0.36)
                ]

                selected_answer = "-"
                selected_bubbles = []

                if len(filled_candidates) == 1:
                    chosen = filled_candidates[0]
                    opt_idx = row_b.index(chosen)
                    selected_answer = option_labels[opt_idx] if opt_idx < 4 else "-"
                    selected_bubbles = [chosen]
                elif len(filled_candidates) > 1:
                    sorted_f = sorted(filled_candidates, key=lambda b: b["filled_ratio"], reverse=True)
                    if sorted_f[0]["filled_ratio"] > sorted_f[1]["filled_ratio"] + 0.14:
                        chosen = sorted_f[0]
                        opt_idx = row_b.index(chosen)
                        selected_answer = option_labels[opt_idx] if opt_idx < 4 else "-"
                        selected_bubbles = [chosen]
                    else:
                        selected_answer = "DOUBTFUL"
                        selected_bubbles = filled_candidates

                detected_answers[str(q_num)] = selected_answer

                # Marks & Visual Feedback (+4 for correct, 0 for wrong/skipped)
                correct_ans = answer_key.get(str(q_num))
                marks = 0

                if correct_ans:
                    correct_idx = option_labels.index(correct_ans) if correct_ans in option_labels else -1

                    if selected_answer not in ["-", "DOUBTFUL"]:
                        if selected_answer == correct_ans:
                            # CORRECT: Green fill
                            marks = 4
                            correct += 1
                            if selected_bubbles:
                                b = selected_bubbles[0]
                                cv2.rectangle(color_preview, (b["x"], b["y"]), (b["x"]+b["w"], b["y"]+b["h"]), (0, 220, 0), -1)
                        else:
                            # WRONG: Red fill for selected, Green outline for correct
                            marks = 0
                            wrong += 1
                            if selected_bubbles:
                                b = selected_bubbles[0]
                                cv2.rectangle(color_preview, (b["x"], b["y"]), (b["x"]+b["w"], b["y"]+b["h"]), (0, 0, 230), -1)
                            # Outline correct answer
                            if 0 <= correct_idx < len(row_b):
                                cb = row_b[correct_idx]
                                cv2.rectangle(color_preview, (cb["x"], cb["y"]), (cb["x"]+cb["w"], cb["y"]+cb["h"]), (0, 220, 0), 2)
                    else:
                        # Unattempted or Doubtful
                        if selected_answer == "DOUBTFUL":
                            for b in selected_bubbles:
                                cv2.rectangle(color_preview, (b["x"], b["y"]), (b["x"]+b["w"], b["y"]+b["h"]), (0, 165, 255), -1)
                        if 0 <= correct_idx < len(row_b):
                            cb = row_b[correct_idx]
                            cv2.rectangle(color_preview, (cb["x"], cb["y"]), (cb["x"]+cb["w"], cb["y"]+cb["h"]), (0, 220, 0), 2)
                else:
                    # No answer key defined
                    for b in selected_bubbles:
                        cv2.rectangle(color_preview, (b["x"], b["y"]), (b["x"]+b["w"], b["y"]+b["h"]), (120, 120, 120), -1)

                # Subject breakdown (25 questions each)
                if q_num <= 25:
                    maths += marks
                elif q_num <= 50:
                    physics += marks
                else:
                    chemistry += marks

        # Encode color preview image
        _, buffer = cv2.imencode('.jpg', color_preview, [cv2.IMWRITE_JPEG_QUALITY, 65])
        processed_b64 = base64.b64encode(buffer).decode('utf-8')

        return {
            "success": True,
            "student_id": student_id_str,
            "processed_image": processed_b64,
            "answers": detected_answers,
            "bubbles_found": len(bubbles),
            "questions_detected": total_questions_processed,
            "marks": {
                "maths": maths,
                "physics": physics,
                "chemistry": chemistry,
                "total": maths + physics + chemistry
            },
            "total_questions": total_questions_processed,
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

