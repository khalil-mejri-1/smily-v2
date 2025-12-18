from PIL import Image
import numpy as np
import cv2
import os
import sys
import io

# Fix for printing Unicode characters in Windows terminal
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def crop_and_add_border(input_path, output_path, threshold=50, border_thickness=2):
    """
    1. يقص الحواف الشفافة.
    2. يضيف إطاراً أسود رقيقاً حول الشكل الفعلي (Contour).
    """
    try:
        # --- الخطوة 1: قص الحواف الشفافة ---
        img = Image.open(input_path).convert("RGBA")
        data = np.array(img)
        alpha_channel = data[:, :, 3]
        
        non_empty_rows = np.where(np.max(alpha_channel, axis=1) > threshold)[0]
        non_empty_cols = np.where(np.max(alpha_channel, axis=0) > threshold)[0]
        
        if len(non_empty_rows) > 0 and len(non_empty_cols) > 0:
            top = non_empty_rows[0]
            bottom = non_empty_rows[-1] + 1
            left = non_empty_cols[0]
            right = non_empty_cols[-1] + 1
            
            cropped_img = img.crop((left, top, right, bottom))
        else:
            print("الصورة شفافة بالكامل.")
            return

        # --- (تم تخطي) الخطوة 2: لا نضيف هامش (Padding) ---
        # بناءً على طلبك، لن نضيف هوامش إضافية، سنرسم الإطار مباشرة على الصورة المقصوصة.
        
        # --- الخطوة 3: رسم الإطار (Contour) باستخدام OpenCV ---
        # تحويل الصورة إلى Numpy Array (OpenCV)
        img_np = np.array(cropped_img)
        
        # استخراج الشفافية (Alpha)
        alpha = img_np[:, :, 3]
        
        # إنشاء قناع (Mask) للأجزاء غير الشفافة
        # نستخدم حد 50 كما في السابق
        _, mask = cv2.threshold(alpha, threshold, 255, cv2.THRESH_BINARY)
        
        # إيجاد حدود الرسم (Contours)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # رسم الإطار
        # cv2.drawContours(image, contours, contourIdx, color, thickness)
        # اللون: (220, 220, 220, 255) -> رمادي فاتح جداً (قريب للأبيض)
        # السماكة: border_thickness
        cv2.drawContours(img_np, contours, -1, (220, 220, 220, 255), border_thickness)
        
        # --- الخطوة 4: الحفظ ---
        final_result = Image.fromarray(img_np)
        final_result.save(output_path)
        
        print(f"تمت العملية بنجاح!")
        print(f"تم قص الصورة وإضافة إطار أسود بسماكة {border_thickness}.")
        print(f"تم حفظ الملف في: {output_path}")

    except FileNotFoundError:
        print(f"عذراً، الملف '{input_path}' غير موجود.")
        sys.exit(1)
    except Exception as e:
        print(f"حدث خطأ: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python crop_border.py <input_path> <output_path> [threshold] [border_thickness]")
        sys.exit(1)
        
    img_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # Optional args
    threshold = int(sys.argv[3]) if len(sys.argv) > 3 else 50
    border_thickness = int(sys.argv[4]) if len(sys.argv) > 4 else 2
    
    crop_and_add_border(img_file, output_file, threshold=threshold, border_thickness=border_thickness)
