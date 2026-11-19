# -*- coding: utf-8 -*-
"""
Portal Asset Preparation Script
Target Requirements:
1. Photos:
   - Minimum resolution: 90 x 120 px
   - File size: strictly 100 KB to 200 KB
   - Format: JPEG (.jpg)
2. Signatures:
   - Only JPEG format (.jpg)
   - Minimum resolution: 100 x 30 px
   - File size: strictly 20 KB to 30 KB
"""

import os
import sys
import io

try:
    from PIL import Image, ImageOps
except ImportError:
    print("[ERROR] Pillow library is not installed. Please install it using: pip install Pillow")
    sys.exit(1)

BASE_DIR = r"D:\Rajesh\10th Class\Photo & Sign"
PHOTOS_SRC = os.path.join(BASE_DIR, "photos_compressed_180_195kb")
PHOTOS_OUT = os.path.join(BASE_DIR, "photos_portal_ready")
SIGNS_OUT = os.path.join(BASE_DIR, "signatures_portal_ready")

os.makedirs(PHOTOS_OUT, exist_ok=True)
os.makedirs(SIGNS_OUT, exist_ok=True)

print("\n" + "="*60)
print(" 10th Class SSC Portal Asset Preparation ")
print(" Rule 1 (Photos): Min 90x120 px, Size: 100 KB to 200 KB")
print(" Rule 2 (Signatures): Only JPEG, Min 100x30 px, Size: 20 KB to 30 KB")
print("="*60 + "\n")

# -------------------------------------------------------------
# Function to save photo strictly within 100 KB - 200 KB
# -------------------------------------------------------------
def optimize_photo(src_path, dest_path):
    with Image.open(src_path) as img:
        img = img.convert('RGB')
        w, h = img.size

        # Ensure aspect ratio >= 90x120
        # Target crisp dimensions between 500x660 and 800x1060
        target_w = max(w, 500)
        target_h = int(target_w * (h / w))
        if target_w > 900:
            target_w = 900
            target_h = int(target_w * (h / w))

        resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

        # Find optimal quality so size is between 110 KB and 190 KB
        best_data = None
        for q in range(95, 25, -2):
            buf = io.BytesIO()
            resized.save(buf, format='JPEG', quality=q, optimize=True)
            size_kb = buf.tell() / 1024.0
            if 105.0 <= size_kb <= 195.0:
                best_data = buf.getvalue()
                break

        # If too small, increase dimensions
        if not best_data:
            for scale_mult in [1.2, 1.4, 1.6, 1.8]:
                sw = int(target_w * scale_mult)
                sh = int(target_h * scale_mult)
                res_temp = img.resize((sw, sh), Image.Resampling.LANCZOS)
                for q in range(95, 30, -5):
                    buf = io.BytesIO()
                    res_temp.save(buf, format='JPEG', quality=q, optimize=True)
                    size_kb = buf.tell() / 1024.0
                    if 105.0 <= size_kb <= 195.0:
                        best_data = buf.getvalue()
                        break
                if best_data:
                    break

        # If still not found, fallback to quality 92
        if not best_data:
            buf = io.BytesIO()
            resized.save(buf, format='JPEG', quality=92, optimize=True)
            best_data = buf.getvalue()

        with open(dest_path, 'wb') as f:
            f.write(best_data)

        final_size = round(os.path.getsize(dest_path) / 1024.0, 1)
        final_img = Image.open(dest_path)
        fw, fh = final_img.size
        return fw, fh, final_size

# -------------------------------------------------------------
# Function to save signature strictly within 20 KB - 30 KB
# -------------------------------------------------------------
def optimize_signature(src_path, dest_path):
    with Image.open(src_path) as img:
        img = img.convert('RGB')
        w, h = img.size

        # Ensure minimum resolution 100x30 px
        # Set target dimensions to e.g. 300x90 or 400x120
        target_w = max(w, 300)
        target_h = max(int(target_w * (h / w)), 90)

        resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

        best_data = None
        for q in range(95, 20, -2):
            buf = io.BytesIO()
            resized.save(buf, format='JPEG', quality=q, optimize=True)
            size_kb = buf.tell() / 1024.0
            if 21.0 <= size_kb <= 29.0:
                best_data = buf.getvalue()
                break

        # If size is too small (signatures with lots of white background compress heavily)
        if not best_data:
            for sw in [450, 600, 750, 900]:
                sh = max(int(sw * (h / w)), 120)
                res_temp = img.resize((sw, sh), Image.Resampling.LANCZOS)
                for q in range(98, 40, -3):
                    buf = io.BytesIO()
                    res_temp.save(buf, format='JPEG', quality=q, optimize=True)
                    size_kb = buf.tell() / 1024.0
                    if 21.0 <= size_kb <= 29.0:
                        best_data = buf.getvalue()
                        break
                if best_data:
                    break

        if not best_data:
            buf = io.BytesIO()
            resized.save(buf, format='JPEG', quality=95, optimize=True)
            best_data = buf.getvalue()

        with open(dest_path, 'wb') as f:
            f.write(best_data)

        final_size = round(os.path.getsize(dest_path) / 1024.0, 1)
        final_img = Image.open(dest_path)
        fw, fh = final_img.size
        return fw, fh, final_size


# -------------------------------------------------------------
# STEP 1: Process Photos (100 KB - 200 KB, Min 90x120)
# -------------------------------------------------------------
print("--- [1] PROCESSING PHOTOS (100 KB - 200 KB, Min 90x120 px) ---")
if os.path.exists(PHOTOS_SRC):
    photo_files = [f for f in os.listdir(PHOTOS_SRC) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    p_count = 0
    for pf in photo_files:
        src = os.path.join(PHOTOS_SRC, pf)
        # Ensure destination is .jpg
        base_name = os.path.splitext(pf)[0] + ".jpg"
        dest = os.path.join(PHOTOS_OUT, base_name)
        try:
            w, h, sz = optimize_photo(src, dest)
            print(f"[PHOTO OK] {base_name} -> {w}x{h} px | {sz} KB (Target: 100-200 KB)")
            p_count += 1
        except Exception as e:
            print(f"[PHOTO ERROR] {pf}: {str(e)}")
    print(f"Total Photos Processed: {p_count} in {PHOTOS_OUT}\n")
else:
    print(f"[WARNING] Photo source folder not found: {PHOTOS_SRC}\n")


# -------------------------------------------------------------
# STEP 2: Process Signatures (20 KB - 30 KB, Min 100x30 px, JPEG)
# -------------------------------------------------------------
print("--- [2] PROCESSING SIGNATURES (20 KB - 30 KB, Min 100x30 px, Only JPEG) ---")

# Check potential signature folders
possible_sign_folders = [
    os.path.join(BASE_DIR, "signatures"),
    os.path.join(BASE_DIR, "Sign"),
    os.path.join(BASE_DIR, "sign"),
    os.path.join(BASE_DIR, "signs"),
    os.path.join(BASE_DIR, "Signatures"),
    os.path.join(BASE_DIR, "signature"),
    os.path.join(BASE_DIR, "signatures_compressed")
]

sign_src_folder = None
for folder in possible_sign_folders:
    if os.path.exists(folder) and len([f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]) > 0:
        sign_src_folder = folder
        break

if sign_src_folder:
    print(f"Found existing signatures folder: {sign_src_folder}")
    sign_files = [f for f in os.listdir(sign_src_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    s_count = 0
    for sf in sign_files:
        src = os.path.join(sign_src_folder, sf)
        base_name = os.path.splitext(sf)[0] + ".jpg"
        dest = os.path.join(SIGNS_OUT, base_name)
        try:
            w, h, sz = optimize_signature(src, dest)
            print(f"[SIGN OK] {base_name} -> {w}x{h} px | {sz} KB (Target: 20-30 KB)")
            s_count += 1
        except Exception as e:
            print(f"[SIGN ERROR] {sf}: {str(e)}")
    print(f"Total Signatures Processed: {s_count} in {SIGNS_OUT}\n")
else:
    print(f"[INFO] No pre-cropped signatures folder found in {BASE_DIR}.")
    print("Checking for signature sheets to auto-crop...")

# -------------------------------------------------------------
# STEP 3: Auto-Crop from Scanned Sheets if needed
# -------------------------------------------------------------
# Check if uploaded sheets exist in conversation brain
brain_sheets = [
    r"C:\Users\SRI\.gemini\antigravity\brain\c7351350-7dc9-42a7-b7cc-1475741e0319\.user_uploaded\media_1795065649842_e2fd9b4f.jpg", # 1-10
    r"C:\Users\SRI\.gemini\antigravity\brain\c7351350-7dc9-42a7-b7cc-1475741e0319\.user_uploaded\media_1795065649871_56cd27a0.jpg", # 11-21
    r"C:\Users\SRI\.gemini\antigravity\brain\c7351350-7dc9-42a7-b7cc-1475741e0319\.user_uploaded\media_1795065649863_4e1543e9.jpg"  # 22-31
]

student_names = [
    # Sheet 1: 1 - 10
    (1, "TARRA LEKHANA", "LEKHANA"),
    (2, "YALLA TEJA CHARAN", "TEJA CHARAN"),
    (3, "CHAKKA SHARAT KUMAR", "SHARAT KUMAR"),
    (4, "METTA LAHARI", "LAHARI"),
    (5, "SIRASANA DHEERAJ", "DHEERAJ"),
    (6, "SANAPALA JAYANTH", "JAYANTH"),
    (7, "CHALLA BALA SAI SIRI VARSHINI", "VARSHINI"),
    (8, "PALLI HARI SURYA CHANDRAN", "HARI SURYA"),
    (9, "BOMMALI RESHMA", "RESHMA"),
    (10, "SURAVARAPU TEJASWINI", "TEJESWINI"),
    # Sheet 2: 11 - 21
    (11, "YALAMANCHI MOHITH", "MOHITH"),
    (12, "RADA VIJAY KUMAR", "VIJAY KUMAR"),
    (13, "MENDA NISHITA", "NISHITHA"),
    (14, "KORADA MADHUKSHARA", "MADHUKSHARA"),
    (15, "VUNNA KOUSHIK", "KOUSHIK"),
    (16, "DIVVALA MAHIDHAR", "MAHIDAR"),
    (17, "KINJARAPU SYAMALA SHRI", "SYMALA"),
    (18, "RUNKU TEJESH", "TEJESH"),
    (19, "TANGI PRAVEEN", "PRAVEEN"),
    (20, "JAMMU HARSHAVARDHAN", "JAMMU HARSHAVARDAN"),
    (21, "PANGA LIKHITESWARI", "LIKITESWARI"),
    # Sheet 3: 22 - 31
    (22, "LAVETI SANJANA", "SANJANA"),
    (23, "GONDU JAHNAVI", "JAHNAVI"),
    (24, "CHINTU BHASHINI", "BHASANI"),
    (25, "RAVADA HARSHA VARDHAN", "R. HARSHAVARDHAN"),
    (26, "DONKANA GOWTHAM", "GOWTHAM"),
    (27, "GEMBALI DURGA SRIKAR", "SREEKAR"),
    (28, "MUDDADA BALARAJU", "BALARAJU"),
    (29, "MARLA JOYSI", "JOYSI"),
    (30, "KARRI BHARGAVI", "BHARGAVI"),
    (31, "KORADA SAI PHANI HARSHA", "SAI PHANI HARSHA")
]

all_sheets_exist = all(os.path.exists(p) for p in brain_sheets)
if all_sheets_exist:
    print("Found official scanned signature sheets! Auto-cropping individual student signatures...")
    
    # Process Sheet 1 (Rows 1 to 10)
    sheet1_img = Image.open(brain_sheets[0])
    W1, H1 = sheet1_img.size
    # Signature column is roughly x: 58% to 98%
    # Table vertical rows start ~12% to ~95%
    row_h1 = (0.95 - 0.12) / 10
    for idx in range(10):
        s_no, full_name, short_name = student_names[idx]
        top = int(H1 * (0.12 + idx * row_h1))
        bottom = int(H1 * (0.12 + (idx + 1) * row_h1))
        left = int(W1 * 0.58)
        right = int(W1 * 0.98)
        
        crop = sheet1_img.crop((left, top, right, bottom))
        dest = os.path.join(SIGNS_OUT, f"{short_name}.jpg")
        
        temp_crop_path = os.path.join(SIGNS_OUT, f"_temp_{short_name}.jpg")
        crop.save(temp_crop_path, 'JPEG')
        w, h, sz = optimize_signature(temp_crop_path, dest)
        try: os.remove(temp_crop_path)
        except: pass
        print(f"[AUTO-SIGN 1-10 OK] {short_name}.jpg -> {w}x{h} px | {sz} KB")

    # Process Sheet 2 (Rows 11 to 21 - 11 rows)
    sheet2_img = Image.open(brain_sheets[1])
    W2, H2 = sheet2_img.size
    row_h2 = (0.98 - 0.08) / 11
    for idx in range(10, 21):
        s_no, full_name, short_name = student_names[idx]
        r_i = idx - 10
        top = int(H2 * (0.08 + r_i * row_h2))
        bottom = int(H2 * (0.08 + (r_i + 1) * row_h2))
        left = int(W2 * 0.58)
        right = int(W2 * 0.98)
        
        crop = sheet2_img.crop((left, top, right, bottom))
        dest = os.path.join(SIGNS_OUT, f"{short_name}.jpg")
        temp_crop_path = os.path.join(SIGNS_OUT, f"_temp_{short_name}.jpg")
        crop.save(temp_crop_path, 'JPEG')
        w, h, sz = optimize_signature(temp_crop_path, dest)
        try: os.remove(temp_crop_path)
        except: pass
        print(f"[AUTO-SIGN 11-21 OK] {short_name}.jpg -> {w}x{h} px | {sz} KB")

    # Process Sheet 3 (Rows 22 to 31 - 10 rows)
    sheet3_img = Image.open(brain_sheets[2])
    W3, H3 = sheet3_img.size
    row_h3 = (0.91 - 0.08) / 10
    for idx in range(21, 31):
        s_no, full_name, short_name = student_names[idx]
        r_i = idx - 21
        top = int(H3 * (0.08 + r_i * row_h3))
        bottom = int(H3 * (0.08 + (r_i + 1) * row_h3))
        left = int(W3 * 0.58)
        right = int(W3 * 0.98)
        
        crop = sheet3_img.crop((left, top, right, bottom))
        dest = os.path.join(SIGNS_OUT, f"{short_name}.jpg")
        temp_crop_path = os.path.join(SIGNS_OUT, f"_temp_{short_name}.jpg")
        crop.save(temp_crop_path, 'JPEG')
        w, h, sz = optimize_signature(temp_crop_path, dest)
        try: os.remove(temp_crop_path)
        except: pass
        print(f"[AUTO-SIGN 22-31 OK] {short_name}.jpg -> {w}x{h} px | {sz} KB")

print("\n" + "="*60)
print(" ALL SSC PORTAL ASSETS READY!")
print(f" 1. Photos Folder (100 KB - 200 KB, >= 90x120 px):\n    {PHOTOS_OUT}")
print(f" 2. Signatures Folder (20 KB - 30 KB, >= 100x30 px, Only JPEG):\n    {SIGNS_OUT}")
print("="*60 + "\n")
