from PIL import Image
import numpy as np

def pro_crop_transparent_edges(input_path: str, output_path: str, alpha_threshold: int = 5) -> None:
  
    try:
        # 1. فتح الصورة والتحويل إلى RGBA ثم إلى مصفوفة NumPy
        img = Image.open(input_path).convert("RGBA")
        np_img = np.array(img)

        # 2. استخراج قناة الألفا
        alpha_channel = np_img[:, :, 3]

        # 3. إنشاء قناع للمحتوى "المرئي" (البيكسلات غير الشفافة بما فيه الكفاية)
        # القناع يكون True حيث Alpha >= alpha_threshold
        mask = alpha_channel >= alpha_threshold

        # 4. إيجاد إحداثيات المحتوى المرئي (الصف y، والعمود x)
        coords = np.argwhere(mask)
        
        # إذا لم يكن هناك محتوى، ننهي العملية
        if coords.size == 0:
            print("⚠️ تحذير: لم يتم العثور على محتوى مرئي يتجاوز عتبة الشفافية المحددة. لم يتم القص.")
            img.save(output_path)
            return

        # 5. حساب المربع المحيط (Bounding Box)
        y_min, x_min = coords.min(axis=0)[:2] 
        y_max, x_max = coords.max(axis=0)[:2] 
        
        # صندوق القص (left, upper, right, lower)
        bbox = (x_min, y_min, x_max + 1, y_max + 1)

        # 6. قص الصورة الأصلية باستخدام إحداثيات المربع المحيط
        cropped_img = img.crop(bbox)

        # 7. حفظ الصورة المقصوصة بصيغة PNG
        cropped_img.save(output_path, format='PNG')
        print(f"✅ تم القص بنجاح (باستخدام عتبة ألفا {alpha_threshold}) وحفظ الصورة في: {output_path}")

    except FileNotFoundError:
        print(f"❌ خطأ: لم يتم العثور على الملف في المسار: {input_path}")
    except Exception as e:
        print(f"❌ حدث خطأ غير متوقع: {e}")

# -------------------------------------------------------------
#                     إعدادات التشغيل
# -------------------------------------------------------------

# تأكد من تثبيت المكتبات: pip install Pillow numpy

# 1. حدد مسار ملف الصورة المدخل. (استخدم اسم الملف الخاص بك)
INPUT_FILE = "a.png" 

# 2. حدد مسار ملف الصورة المخرج
OUTPUT_FILE = "cropped_dfffresult.png"

# --------------------------------------------------------------------------------------
ALPHA_THRESHOLD = 150 # جرب هذه القيمة أولاً، ثم ارفعها إذا لم تقص بشكل كافٍ

# 4. تشغيل الدالة
pro_crop_transparent_edges(INPUT_FILE, OUTPUT_FILE, alpha_threshold=ALPHA_THRESHOLD)