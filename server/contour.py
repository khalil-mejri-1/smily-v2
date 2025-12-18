import sys
import io

# Fix for printing Unicode characters in Windows terminal
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    from PIL import Image
    import numpy as np
    import cv2
    import os
except ImportError as e:
    print(f"Import Error: {e}", file=sys.stderr)
    sys.exit(1)

def crop_and_add_border(input_path, output_path, threshold=50, border_thickness=2):
    """
    1. يقص الحواف الشفافة.
    2. يضيف إطاراً أسود رقيقاً حول الشكل الفعلي (Contour).
    """
    try:
        # --- الخطوة 1: قص الحواف وتجاهل الضوضاء (النقاط الصغيرة) ---
        img = Image.open(input_path).convert("RGBA")
        data = np.array(img)
        alpha = data[:, :, 3]

        # 1. تنظيف أولي (Thresholding)
        _, thresh_alpha = cv2.threshold(alpha, threshold, 255, cv2.THRESH_BINARY)
        
        # 2. إيجاد الكونتورات (الأجسام المتصلة)
        contours, _ = cv2.findContours(thresh_alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            print("الصورة شفافة بالكامل.", file=sys.stderr)
            return

        # 3. فلترة الكونتورات الصغيرة (النقاط في الزوايا)
        # نحتفظ فقط بالكونتورات التي مساحتها أكبر من حد معين
        # لنقل 100 بكسل، هذا يكفي لتجاهل نويز ولكن يبقي النصوص أو الأجزاء الصغيرة المهمة
        valid_contours = []
        for cnt in contours:
            if cv2.contourArea(cnt) > 100: 
                valid_contours.append(cnt)
        
        if not valid_contours:
            # إذا فلترنا كل شيء (ربما الصورة أصلها صغير جداً)، نعود لأخذ أكبر كونتور موجود
            if contours:
                valid_contours = [max(contours, key=cv2.contourArea)]
            else:
                 print("لا يوجد محتوى صالح.", file=sys.stderr)
                 return

        # 4. إيجاد المستطيل المحيط بكافة الكونتورات الصالحة والمجمعة
        # نريد قصاً واحداً يشمل كل الأجزاء "المهمة"
        all_valid_points = np.vstack(valid_contours)
        x, y, w, h = cv2.boundingRect(all_valid_points)
        
        # 5. القص
        cropped_img = img.crop((x, y, x + w, y + h))

        # --- الخطوة 2: رسم الإطار (Contour) باستخدام OpenCV ---
        # تحويل الصورة إلى Numpy Array (OpenCV)
        img_np = np.array(cropped_img)
        
        # استخراج الشفافية (Alpha)
        alpha = img_np[:, :, 3]
        
        # إنشاء قناع (Mask) للأجزاء غير الشفافة
        _, mask = cv2.threshold(alpha, threshold, 255, cv2.THRESH_BINARY)
        
        # إيجاد حدود الرسم (Contours)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # رسم الإطار
        # اللون: (220, 220, 220, 255) -> رمادي فاتح جداً
        cv2.drawContours(img_np, contours, -1, (220, 220, 220, 255), border_thickness)
        
        # --- الخطوة 3: الحفظ ---
        final_result = Image.fromarray(img_np)
        final_result.save(output_path)
        
        print(f"تمت العملية بنجاح!")
        print(f"تم قص الصورة وإضافة إطار بسماكة {border_thickness}.")
        print(f"تم حفظ الملف في: {output_path}")

    except FileNotFoundError:
        print(f"عذراً، الملف '{input_path}' غير موجود.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"حدث خطأ: {e}", file=sys.stderr)
        # Ensure we exit with error code so Node.js knows it failed
        sys.exit(1)

if __name__ == "__main__":
    # index.js passes: script, input, output, border_mm, sticker_size_cm
    if len(sys.argv) < 3:
        print("Usage: python contour.py <input_path> <output_path> [border_mm] [sticker_size_cm]")
        sys.exit(1)
        
    img_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # Defaults
    threshold = 50
    border_thickness = 2
    
    # Handle arguments passed by index.js
    # argv[3] is border_mm (float string)
    # argv[4] is sticker_size_cm (float string)
    
    if len(sys.argv) > 3:
        try:
            # We ignore border_mm for now and use fixed thickness, 
            # Or map it? 1mm ~ 4px. let's just use the user requested default of 2 or 1
            # But ensure we don't crash on "0.1"
            val = float(sys.argv[3])
            # border_thickness = max(1, int(val * 4)) # Example mapping
            border_thickness = 2 # Keeping it simple as per user code request
        except ValueError:
            border_thickness = 2
            
    # We ignore size_cm (argv[4]) as the user code doesn't resize.
    
    crop_and_add_border(img_file, output_file, threshold=threshold, border_thickness=border_thickness)
