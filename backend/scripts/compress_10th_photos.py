"""
10th Class Student Photo Compressor (180 KB - 195 KB Target) in Python
Uses Pillow with 4:4:4 Chroma Subsampling (subsampling=0) & MozJPEG/progressive encoding
for maximum studio clarity and facial sharpness.
"""

import os
import sys
import math
from io import BytesIO

try:
    from PIL import Image, ImageOps
except ImportError:
    print("Error: Pillow library is not installed. Run: pip install pillow")
    sys.exit(1)

DEFAULT_INPUT = r"D:\Rajesh\10th Class\Photo & Sign\photos"
input_dir = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT
output_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(input_dir), "photos_compressed_180_195kb")

MIN_KB = 180
MAX_KB = 195
MIN_BYTES = MIN_KB * 1024
MAX_BYTES = MAX_KB * 1024
TARGET_BYTES = 187.5 * 1024

VALID_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}

def compress_single_image(in_path, out_path):
    with Image.open(in_path) as img:
        # Handle EXIF auto rotation
        img = ImageOps.exif_transpose(img)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        orig_w, orig_h = img.size

        def render(scale, quality):
            w = max(20, int(round(orig_w * scale)))
            h = max(20, int(round(orig_h * scale)))
            
            # High-end Lanczos resampling for crystal clear details
            if abs(scale - 1.0) > 0.001:
                resized = img.resize((w, h), Image.Resampling.LANCZOS)
            else:
                resized = img
            
            buf = BytesIO()
            # subsampling=0 means 4:4:4 chroma subsampling (zero color loss for faces)
            resized.save(
                buf,
                format='JPEG',
                quality=int(round(max(1, min(100, quality)))),
                subsampling=0,
                optimize=True,
                progressive=True
            )
            return buf.getvalue()

        # Step 1: Initial test at scale 1.0, quality 92
        best_scale = 1.0
        best_quality = 92
        buf = render(best_scale, best_quality)

        if MIN_BYTES <= len(buf) <= MAX_BYTES:
            with open(out_path, 'wb') as f:
                f.write(buf)
            return len(buf)

        best_buf = buf
        best_diff = abs(len(buf) - TARGET_BYTES)

        # Step 2: Binary search scale
        low_scale = 0.05
        high_scale = 1.0 if len(buf) > MAX_BYTES else 3.0

        for _ in range(12):
            mid_scale = (low_scale + high_scale) / 2
            test_buf = render(mid_scale, 92)
            diff = abs(len(test_buf) - TARGET_BYTES)

            if diff < best_diff:
                best_diff = diff
                best_buf = test_buf
                best_scale = mid_scale

            if MIN_BYTES <= len(test_buf) <= MAX_BYTES:
                best_buf = test_buf
                with open(out_path, 'wb') as f:
                    f.write(best_buf)
                return len(best_buf)

            if len(test_buf) > TARGET_BYTES:
                high_scale = mid_scale
            else:
                low_scale = mid_scale

        # Step 3: Fine-tune quality in [70..100] around best_scale
        low_q, high_q = 70, 100
        for _ in range(8):
            mid_q = (low_q + high_q) / 2
            test_buf = render(best_scale, mid_q)
            diff = abs(len(test_buf) - TARGET_BYTES)

            if diff < best_diff:
                best_diff = diff
                best_buf = test_buf
                best_quality = mid_q

            if MIN_BYTES <= len(test_buf) <= MAX_BYTES:
                best_buf = test_buf
                with open(out_path, 'wb') as f:
                    f.write(best_buf)
                return len(best_buf)

            if len(test_buf) > TARGET_BYTES:
                high_q = mid_q
            else:
                low_q = mid_q

        # Step 4: Step-by-step micro tuning
        if len(best_buf) < MIN_BYTES:
            for step in range(1, 9):
                fine_scale = best_scale * (1 + step * 0.015)
                test_buf = render(fine_scale, min(100, best_quality + step))
                if MIN_BYTES <= len(test_buf) <= MAX_BYTES:
                    best_buf = test_buf
                    break
                if len(test_buf) > MAX_BYTES:
                    break
                best_buf = test_buf
        elif len(best_buf) > MAX_BYTES:
            for step in range(1, 9):
                fine_scale = best_scale * (1 - step * 0.015)
                test_buf = render(fine_scale, max(70, best_quality - step))
                if MIN_BYTES <= len(test_buf) <= MAX_BYTES:
                    best_buf = test_buf
                    break
                if len(test_buf) < MIN_BYTES:
                    break
                best_buf = test_buf

        with open(out_path, 'wb') as f:
            f.write(best_buf)
        return len(best_buf)

def main():
    print("=" * 64)
    print("   📸 10th Class Student Photo Quality Compressor (180 - 195 KB)")
    print("=" * 64)
    print(f"📂 Input Folder  : {input_dir}")
    print(f"📁 Output Folder : {output_dir}")
    print(f"🎯 Target Size   : {MIN_KB} KB to {MAX_KB} KB (Crystal Clear Quality)")
    print("-" * 64)

    if not os.path.exists(input_dir):
        print(f"❌ Input directory not found: {input_dir}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    files = [f for f in os.listdir(input_dir) if os.path.splitext(f)[1].lower() in VALID_EXTS]
    if not files:
        print("⚠️ No supported image files (.jpg, .jpeg, .png, .webp) found in the input folder.")
        sys.exit(0)

    print(f"Found {len(files)} photo(s) to process...\n")

    success_count = 0
    for idx, f in enumerate(files, 1):
        in_path = os.path.join(input_dir, f)
        base_name = os.path.splitext(f)[0]
        out_path = os.path.join(output_dir, base_name + ".jpg")

        orig_kb = os.path.getsize(in_path) / 1024.0
        try:
            new_bytes = compress_single_image(in_path, out_path)
            new_kb = new_bytes / 1024.0
            is_perfect = MIN_BYTES <= new_bytes <= MAX_BYTES
            if is_perfect:
                success_count += 1
                print(f"✅ [{idx}/{len(files)}] {f}")
                print(f"   Original: {orig_kb:.1f} KB  -->  New: {new_kb:.1f} KB [PERFECT: 180-195 KB]")
            else:
                print(f"⚠️ [{idx}/{len(files)}] {f}")
                print(f"   Original: {orig_kb:.1f} KB  -->  New: {new_kb:.1f} KB [Near Target]")
        except Exception as e:
            print(f"❌ [{idx}/{len(files)}] Error processing {f}: {e}")

    print("\n" + "=" * 64)
    print(f"🎉 Finished! Successfully processed: {success_count} / {len(files)} photos")
    print("📁 All compressed photos are safely saved in:")
    print(f"   {output_dir}")
    print("=" * 64 + "\n")

if __name__ == '__main__':
    main()
