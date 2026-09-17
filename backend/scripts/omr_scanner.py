import cv2
import numpy as np
import sys
import json

def process_omr(image_path, answer_key):
    try:
        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Could not read image"}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

        h, w = thresh.shape

        # --- OMR Layout Config ---
        # 75 questions in 3 columns of 25 (Maths, Physics, Chemistry)
        # 4 options per question (A, B, C, D)
        NUM_QUESTIONS = 75
        NUM_OPTIONS = 4
        QUESTIONS_PER_COL = 25
        NUM_COLS = 3

        # Approximate bubble region (tune these for your specific OMR sheet)
        # These are fractions of the image dimensions
        bubble_area_top = int(h * 0.18)
        bubble_area_bottom = int(h * 0.95)
        bubble_area_left = int(w * 0.05)
        bubble_area_right = int(w * 0.95)

        bubble_h = bubble_area_bottom - bubble_area_top
        bubble_w = bubble_area_right - bubble_area_left

        col_width = bubble_w // NUM_COLS
        row_height = bubble_h // QUESTIONS_PER_COL
        option_width = col_width // NUM_OPTIONS

        answers = {}
        correct = 0
        wrong = 0
        maths = 0
        physics = 0
        chemistry = 0

        option_labels = ['A', 'B', 'C', 'D']

        for col_idx in range(NUM_COLS):
            for row_idx in range(QUESTIONS_PER_COL):
                q_num = col_idx * QUESTIONS_PER_COL + row_idx + 1

                col_start = bubble_area_left + col_idx * col_width
                row_start = bubble_area_top + row_idx * row_height
                row_end = row_start + row_height

                bubble_counts = []
                for opt_idx in range(NUM_OPTIONS):
                    opt_start = col_start + opt_idx * option_width
                    opt_end = opt_start + option_width

                    roi = thresh[row_start:row_end, opt_start:opt_end]
                    filled = cv2.countNonZero(roi)
                    bubble_counts.append(filled)

                max_filled = max(bubble_counts)
                selected_count = sum(1 for b in bubble_counts if b > max_filled * 0.6)

                if max_filled < 400:
                    selected_answer = "-"  # Unanswered
                elif selected_count > 1:
                    selected_answer = "DOUBTFUL"  # Multiple bubbles filled
                else:
                    selected_answer = option_labels[bubble_counts.index(max_filled)]

                answers[str(q_num)] = selected_answer

                correct_ans = answer_key.get(str(q_num))
                if selected_answer not in ["-", "DOUBTFUL"] and correct_ans:
                    if selected_answer == correct_ans:
                        marks = 4
                        correct += 1
                    else:
                        marks = -1
                        wrong += 1
                else:
                    marks = 0

                if q_num <= 25:
                    maths += marks
                elif q_num <= 50:
                    physics += marks
                else:
                    chemistry += marks

        return {
            "success": True,
            "student_id": "AUTO_DETECT",
            "answers": answers,
            "marks": {
                "maths": maths,
                "physics": physics,
                "chemistry": chemistry,
                "total": maths + physics + chemistry
            },
            "total_questions": NUM_QUESTIONS,
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
    except Exception as e:
        ans_key = {}

    output = process_omr(img_path, ans_key)
    print(json.dumps(output))
