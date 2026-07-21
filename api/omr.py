import json
import base64
import numpy as np
import cv2
from http.server import BaseHTTPRequestHandler

# ============================================================
# JY School OMR Processor API - Vercel Serverless Function
# 100% PURE COMPUTER VISION CONTOUR DETECTION ENGINE
# ============================================================

TARGET_W = 1200
TARGET_H = 1600

GRID_Y_START     = 752
GRID_ROW_SPACING = 41

GROUPS_X = [
    [132, 169, 208, 248],    # Group 1  (Q01–Q15)
    [350, 389, 426, 464],    # Group 2  (Q16–Q30)
    [567, 603, 641, 679],    # Group 3  (Q31–Q45)
    [780, 816, 855, 889],    # Group 4  (Q46–Q60)
    [993, 1031, 1069, 1107], # Group 5  (Q61–Q75)
]

OPTIONS = ['A', 'B', 'C', 'D']

ID_GRID_Y_START     = 205
ID_GRID_ROW_SPACING = 31
ID_COLS_X           = [121, 153, 185, 217, 248, 280, 312]


def find_closest_bubble(x, y, bubbles, max_dist=35):
    """Finds the closest detected contour circle to a given point"""
    closest = None
    min_d = float('inf')
    for b in bubbles:
        d = ((b['cx'] - x)**2 + (b['cy'] - y)**2)**0.5
        if d < min_d and d < max_dist:
            min_d = d
            closest = b
    return closest

def read_student_id_vision(gray, bubbles, fill_threshold=140):
    digits = []
    for col_x in ID_COLS_X:
        vals = []
        for digit in range(10):
            y = ID_GRID_Y_START + digit * ID_GRID_ROW_SPACING
            
            # Snap to real bubble using Computer Vision
            real_b = find_closest_bubble(col_x, y, bubbles)
            if real_b:
                bx, by, br = real_b['cx'], real_b['cy'], 10
            else:
                bx, by, br = col_x, y, 10
                
            region = gray[max(0, by-br):by+br, max(0, bx-br):bx+br]
            vals.append(float(np.mean(region)) if region.size > 0 else 255.0)
            
        min_val = min(vals)
        if min_val < fill_threshold:
            digits.append(str(vals.index(min_val)))
        else:
            digits.append('0') # Default to 0 if unsure for ID
    return "".join(digits)

def process_omr_vision(image_bytes, fill_threshold=140):
    nparr = np.frombuffer(image_bytes, np.uint8)
    raw = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if raw is None:
        raise ValueError("Invalid image file")

    sheet = cv2.resize(raw, (TARGET_W, TARGET_H))
    gray = cv2.cvtColor(sheet, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Adaptive thresholding to find solid shapes
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 4)
    cnts, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter for circular bubbles
    bubbles = []
    for c in cnts:
        (x, y, w, h) = cv2.boundingRect(c)
        ar = w / float(h)
        if 12 <= w <= 50 and 12 <= h <= 50 and 0.7 <= ar <= 1.3:
            bubbles.append({"cx": x + w//2, "cy": y + h//2, "r": max(w,h)//2, "contour": c})

    # Prepare Negative Vision Preview
    vision_preview = np.zeros_like(sheet)
    # Draw all detected shapes in dark gray
    cv2.drawContours(vision_preview, [c['contour'] for c in bubbles], -1, (100, 100, 100), 1)

    student_id = read_student_id_vision(gray, bubbles, fill_threshold)
    formatted_student_id = "JY26-" + student_id[-4:] if len(student_id) >= 4 else "JY26-0000"

    answers = {}
    filled_count = 0
    
    for g_idx, gxs in enumerate(GROUPS_X):
        for row in range(15):
            q = str(g_idx * 15 + row + 1)
            approx_y = GRID_Y_START + row * GRID_ROW_SPACING
            
            vals = []
            real_positions = []
            
            for x in gxs:
                real_b = find_closest_bubble(x, approx_y, bubbles)
                if real_b:
                    bx, by, br = real_b['cx'], real_b['cy'], 11
                    # Draw detected bubble in white on preview
                    cv2.circle(vision_preview, (bx, by), br, (255, 255, 255), 2)
                else:
                    bx, by, br = x, approx_y, 11
                    
                real_positions.append((bx, by, br))
                region = gray[max(0, by-br):by+br, max(0, bx-br):bx+br]
                vals.append(float(np.mean(region)) if region.size > 0 else 255.0)

            min_val = min(vals)
            if min_val < fill_threshold:
                ans_idx = vals.index(min_val)
                answers[q] = OPTIONS[ans_idx]
                filled_count += 1
                
                # Draw RED circle for the detected answer on the preview
                ans_x, ans_y, ans_r = real_positions[ans_idx]
                cv2.circle(vision_preview, (ans_x, ans_y), ans_r + 4, (0, 0, 255), -1)
            else:
                answers[q] = None

    # Encode Vision Preview to base64
    _, buffer = cv2.imencode('.jpg', vision_preview, [cv2.IMWRITE_JPEG_QUALITY, 80])
    vision_b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

    return formatted_student_id, answers, filled_count, vision_b64


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

            img_data = data['image']
            if ',' in img_data:
                img_data = img_data.split(',')[1]
            image_bytes = base64.b64decode(img_data)

            answer_key = data.get('answer_key', None)

            student_id, answers, filled_count, vision_b64 = process_omr_vision(image_bytes)

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
                'max_score': len(answer_key) * 4 if answer_key else 300,
                'vision_preview': vision_b64
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
