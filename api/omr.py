import json
import base64
import numpy as np
import cv2
from http.server import BaseHTTPRequestHandler

# ============================================================
# JY School OMR Processor API - Vercel Serverless Function
# ============================================================

TARGET_W = 1200
TARGET_H = 1600

GRID_Y_START     = 752    # Y of Q01 bubble center
GRID_ROW_SPACING = 41     # pixels between question rows

GROUPS_X = [
    [132, 169, 208, 248],    # Group 1  (Q01–Q15)
    [350, 389, 426, 464],    # Group 2  (Q16–Q30)
    [567, 603, 641, 679],    # Group 3  (Q31–Q45)
    [780, 816, 855, 889],    # Group 4  (Q46–Q60)
    [993, 1031, 1069, 1107], # Group 5  (Q61–Q75)
]

OPTIONS = ['A', 'B', 'C', 'D']

# ── STUDENT ID GRID POSITIONS ──────────────────────────────
ID_GRID_Y_START     = 205    # Y center of '0' bubble row
ID_GRID_ROW_SPACING = 31     # Y distance between 0..9 rows
ID_COLS_X           = [121, 153, 185, 217, 248, 280, 312] # 7 columns

def read_student_id(gray, fill_threshold=140):
    digits = []
    for col_x in ID_COLS_X:
        vals = []
        for digit in range(10):
            y = ID_GRID_Y_START + digit * ID_GRID_ROW_SPACING
            r = 10
            region = gray[max(0, y-r):y+r, max(0, col_x-r):col_x+r]
            vals.append(float(np.mean(region)) if region.size > 0 else 255.0)
        min_val = min(vals)
        if min_val < fill_threshold:
            digits.append(str(vals.index(min_val)))
        else:
            digits.append('?')
    return "".join(digits)

def process_omr(image_bytes, fill_threshold=140):
    nparr = np.frombuffer(image_bytes, np.uint8)
    raw = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if raw is None:
        raise ValueError("Invalid image file")

    sheet = cv2.resize(raw, (TARGET_W, TARGET_H))
    gray = cv2.cvtColor(sheet, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    student_id = read_student_id(gray, fill_threshold)

    answers = {}
    for g_idx, gxs in enumerate(GROUPS_X):
        for row in range(15):
            q = g_idx * 15 + row + 1
            y = GRID_Y_START + row * GRID_ROW_SPACING
            
            vals = []
            for x in gxs:
                r = 13
                region = gray[max(0, y-r):y+r, max(0, x-r):x+r]
                vals.append(float(np.mean(region)) if region.size > 0 else 255.0)

            min_val = min(vals)
            if min_val < fill_threshold:
                answers[str(q)] = OPTIONS[vals.index(min_val)]
            else:
                answers[str(q)] = None

    filled_count = sum(1 for a in answers.values() if a is not None)
    return student_id, answers, filled_count


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            if 'image' not in data:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No image provided'}).encode())
                return

            # Decode base64 image
            img_data = data['image']
            if ',' in img_data:
                img_data = img_data.split(',')[1]
            image_bytes = base64.b64decode(img_data)

            # Optional answer key passed from frontend: {"1": "A", "2": "B", ...}
            answer_key = data.get('answer_key', None)

            student_id, answers, filled_count = process_omr(image_bytes)

            score = 0
            correct_count = 0
            wrong_count = 0

            if answer_key and isinstance(answer_key, dict):
                for q_num, correct_opt in answer_key.items():
                    student_ans = answers.get(str(q_num))
                    if student_ans is not None:
                        if student_ans == correct_opt:
                            correct_count += 1
                        else:
                            wrong_count += 1

                # No negative marking: 4 marks per correct answer
                score = correct_count * 4

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response_payload = {
                'success': True,
                'student_id': student_id,
                'answers': answers,
                'total_questions': 75,
                'filled_count': filled_count,
                'blank_count': 75 - filled_count,
                'score': score if answer_key else None,
                'correct_count': correct_count if answer_key else None,
                'wrong_count': wrong_count if answer_key else None,
                'max_score': len(answer_key) * 4 if answer_key else 300
            }
            self.wfile.write(json.dumps(response_payload).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
