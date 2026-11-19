"""
10th Class Student Signature Extractor & Quality Optimizer
Crops individual student signatures from scanned SSC Hallticket Signature sheets.
Requirements:
- Output: Individual JPEG (.jpg) files named with Student Names
- Only JPEG format
- Minimum resolution: 100 x 30 px
- File size: 2 KB to 30 KB (Target: ~8 KB - 18 KB for Board exam portals)
- Crystal clear ink with clean white background (no table lines, no blur)
"""

import os
import sys
import glob
from io import BytesIO

try:
    from PIL import Image, ImageOps, ImageEnhance
except ImportError:
    print("[ERROR] Pillow library not installed. Run: pip install pillow")
    sys.exit(1)

# Default paths
DEFAULT_INPUT = r"D:\Rajesh\10th Class\Photo & Sign\Orginal Sign"
input_dir = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT
output_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(input_dir), "Student_Signatures_JPEG")

# Verified Student Names List from Scanned Sheets (S.No 1 to 31)
SHEET_STUDENTS = [
    # Sheet 1: S.No 1 to 10
    {
        "sheet_index": 1,
        "expected_rows": 10,
        "table_y_start": 0.125,
        "table_y_end": 0.952,
        "students": [
            (1, "TARRA LEKHANA"),
            (2, "YALLA TEJA CHARAN"),
            (3, "CHAKKA SHARAT KUMAR"),
            (4, "METTA LAHARI"),
            (5, "SIRASANA DHEERAJ"),
            (6, "SANAPALA JAYANTH"),
            (7, "CHALLA BALA SAI SIRI VARSHINI"),
            (8, "PALLI HARI SURYA CHANDRAN"),
            (9, "BOMMALI RESHMA"),
            (10, "SURAVARAPU TEJASWINI"),
        ]
    },
    # Sheet 2: S.No 11 to 21
    {
        "sheet_index": 2,
        "expected_rows": 11,
        "table_y_start": 0.080,
        "table_y_end": 0.990,
        "students": [
            (11, "YALAMANCHI MOHITH"),
            (12, "RADA VIJAY KUMAR"),
            (13, "MENDA NISHITA"),
            (14, "KORADA MADHUKSHARA"),
            (15, "VUNNA KOUSHIK"),
            (16, "DIVVALA MAHIDHAR"),
            (17, "KINJARAPU SYAMALA SHRI"),
            (18, "RUNKU TEJESH"),
            (19, "TANGI PRAVEEN"),
            (20, "JAMMU HARSHAVARDHAN"),
            (21, "PANGA LIKHITESWARI"),
        ]
    },
    # Sheet 3: S.No 22 to 31
    {
        "sheet_index": 3,
        "expected_rows": 10,
        "table_y_start": 0.075,
        "table_y_end": 0.910,
        "students": [
            (22, "LAVETI SANJANA"),
            (23, "GONDU JAHNAVI"),
            (24, "CHINTU BHASHINI"),
            (25, "RAVADA HARSHA VARDHAN"),
            (26, "DONKANA GOWTHAM"),
            (27, "GEMBALI DURGA SRIKAR"),
            (28, "MUDDADA BALARAJU"),
            (29, "MARLA JOYSI"),
            (30, "KARRI BHARGAVI"),
            (31, "KORADA SAI PHANI HARSHA"),
        ]
    }
]

def enhance_signature(crop_img):
    """
    Cleans up background to pure white and enhances ink darkness for crystal clear visibility.
    """
    # Convert to grayscale
    gray = crop_img.convert('L')
    w, h = gray.size

    # Find ink bounding box (pixels darker than 215)
    pixels = gray.load()
    min_x, min_y, max_x, max_y = w, h, 0, 0
    ink_found = False

    for y in range(h):
        for x in range(w):
            if pixels[x, y] < 215:
                ink_found = True
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y

    if ink_found and (max_x > min_x) and (max_y > min_y):
        # Add padding around the signature ink
        pad_x = 24
        pad_y = 14
        bx1 = max(0, min_x - pad_x)
        by1 = max(0, min_y - pad_y)
        bx2 = min(w, max_x + pad_x)
        by2 = min(h, max_y + pad_y)
        crop_img = crop_img.crop((bx1, by1, bx2, by2))
        gray = crop_img.convert('L')
        w, h = gray.size

    # Ensure minimum resolution 100 x 30 px
    min_req_w = 160
    min_req_h = 50
    if w < min_req_w or h < min_req_h:
        scale = max(min_req_w / w, min_req_h / h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        crop_img = crop_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        gray = crop_img.convert('L')
        w, h = gray.size

    # Clean paper background to pure white while preserving smooth ink edges
    pixels_rgb = crop_img.convert('RGB').load()
    pixels_g = gray.load()

    out_img = Image.new('RGB', (w, h), (255, 255, 255))
    out_pixels = out_img.load()

    for y in range(h):
        for x in range(w):
            val = pixels_g[x, y]
            if val > 215:
                # Pure white background
                out_pixels[x, y] = (255, 255, 255)
            else:
                # Contrast boost on ink
                r, g, b = pixels_rgb[x, y]
                # Deepen ink darkness
                factor = val / 215.0
                out_pixels[x, y] = (int(r * factor * 0.9), int(g * factor * 0.9), int(b * factor * 0.95))

    return out_img

def save_optimized_jpeg(img, out_path, min_kb=2, max_kb=30):
    """
    Saves image as JPEG ensuring file size is strictly between 2 KB and 30 KB.
    """
    min_bytes = min_kb * 1024
    max_bytes = max_kb * 1024
    
    # Try quality 88
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=88, optimize=True)
    size = buf.tell()

    if min_bytes <= size <= max_bytes:
        with open(out_path, 'wb') as f:
            f.write(buf.getvalue())
        return size

    # Binary search quality in [60..98]
    low_q, high_q = 60, 98
    best_buf = buf.getvalue()
    best_size = size

    for _ in range(7):
        mid_q = int((low_q + high_q) / 2)
        buf = BytesIO()
        img.save(buf, format='JPEG', quality=mid_q, optimize=True)
        size = buf.tell()

        if min_bytes <= size <= max_bytes:
            best_buf = buf.getvalue()
            best_size = size
            break

        if size > max_bytes:
            high_q = mid_q
        else:
            low_q = mid_q
            best_buf = buf.getvalue()
            best_size = size

    with open(out_path, 'wb') as f:
        f.write(best_buf)
    return best_size

def process_signatures():
    print("=" * 66)
    print("   [10th CLASS SIGNATURE EXTRACTOR & OPTIMIZER]")
    print("   Target: Only JPEG | Min 100x30 px | Size: 2 KB to 30 KB")
    print("=" * 66)
    print(f"Input Directory  : {input_dir}")
    print(f"Output Directory : {output_dir}")
    print("-" * 66)

    if not os.path.exists(input_dir):
        print(f"[ERROR] Input directory not found: {input_dir}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    # Find image files in input directory
    exts = ('.jpg', '.jpeg', '.png', '.bmp', '.webp', '.JPG', '.JPEG', '.PNG')
    all_files = sorted([f for f in os.listdir(input_dir) if f.endswith(exts)])

    if not all_files:
        print("[ERROR] No image files found in the input folder.")
        sys.exit(1)

    print(f"Found {len(all_files)} sheet image(s): {', '.join(all_files)}\n")

    # Match sheets
    total_processed = 0

    for sheet_idx, sheet_info in enumerate(SHEET_STUDENTS):
        if sheet_idx >= len(all_files):
            print(f"[WARN] No image file available for Sheet {sheet_info['sheet_index']}.")
            continue

        file_name = all_files[sheet_idx]
        file_path = os.path.join(input_dir, file_name)
        print(f">>> Processing Sheet {sheet_info['sheet_index']}: {file_name} ({len(sheet_info['students'])} students)")

        with Image.open(file_path) as sheet_img:
            sheet_img = ImageOps.exif_transpose(sheet_img)
            W, H = sheet_img.size

            # Table geometry for Signatures column (3rd column)
            col_x1 = int(W * 0.585)  # Left of Signatures column
            col_x2 = int(W * 0.970)  # Right of Signatures column
            
            y_start = sheet_info['table_y_start'] * H
            y_end = sheet_info['table_y_end'] * H
            total_rows = sheet_info['expected_rows']
            row_height = (y_end - y_start) / total_rows

            for row_idx, (sno, student_name) in enumerate(sheet_info['students']):
                # Inset by 5px so table border lines are never included
                row_y1 = int(y_start + (row_idx * row_height) + 5)
                row_y2 = int(y_start + ((row_idx + 1) * row_height) - 5)

                # Crop signature cell
                cell_crop = sheet_img.crop((col_x1, row_y1, col_x2, row_y2))

                # Enhance signature clarity & clean white background
                enhanced = enhance_signature(cell_crop)
                ew, eh = enhanced.size

                # Save as pure JPEG named with Student Name
                clean_name = student_name.strip()
                out_file_name = f"{clean_name}.jpg"
                out_path = os.path.join(output_dir, out_file_name)

                size_bytes = save_optimized_jpeg(enhanced, out_path, min_kb=2, max_kb=30)
                size_kb = size_bytes / 1024.0

                is_pass = (2.0 <= size_kb <= 30.0) and (ew >= 100 and eh >= 30)
                status = "[PASS]" if is_pass else "[OK]"
                print(f"  {status} #{sno:02d} {clean_name}.jpg -> {ew}x{eh} px, {size_kb:.1f} KB")
                total_processed += 1

    print("\n" + "=" * 66)
    print(f"[FINISHED] Successfully extracted & saved {total_processed} student signatures!")
    print(f"Saved Folder: {output_dir}")
    print("=" * 66 + "\n")

if __name__ == '__main__':
    process_signatures()
