# contour.py (الكود المحدّث)
import sys
from PIL import Image, ImageFilter, ImageChops
import numpy as np 
import os
from collections import Counter # تم الإبقاء عليها على الرغم من عدم استخدامها مباشرة

# ----------------------------------------------------------------------
#                         المتغيرات الثابتة (Constants)
# ----------------------------------------------------------------------

# الدقة بالبوصة: ثابت مهم لحساب البيكسلات من المليمترات
DPI = 300 

# عتبة ألفا (شفافية) للقص الأولي
ALPHA_THRESHOLD_TRIM = 5 

# عتبة ألفا (شفافية) للقص النهائي بعد إضافة الإطار
# قيمة 10 مناسبة لملف contour.py الأصلي
ALPHA_THRESHOLD_FINAL =200


# ----------------------------------------------------------------------
#                         الدوال المساعدة (Helper Functions)
# ----------------------------------------------------------------------

# استخدام دالة عادية بدلاً من Lambda لـ MM_TO_PIXELS لتحسين القراءة
def MM_TO_PIXELS(mm: float) -> int:
    """تحويل قيمة من المليمتر إلى بيكسلات بناءً على قيمة DPI."""
    return round((mm / 25.4) * DPI)

def trim_transparent_edges_numpy(img: Image.Image, alpha_threshold: int) -> Image.Image:
    """
    يقص الحواف الشفافة الزائدة بدقة باستخدام عتبة الألفا (Alpha Threshold).
    :param img: صورة PIL بصيغة RGBA.
    :param alpha_threshold: عتبة قناة الألفا لتحديد المحتوى المرئي.
    :return: صورة PIL مقصوصة.
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
        
    np_img = np.array(img)
    alpha_channel = np_img[:, :, 3]

    # إنشاء قناع للمحتوى "المرئي"
    mask = alpha_channel >= alpha_threshold
    
    # إيجاد إحداثيات المحتوى المرئي
    coords = np.argwhere(mask)
    
    if coords.size == 0:
        # إرجاع صورة شفافة صغيرة إذا لم يتم العثور على محتوى
        return Image.new("RGBA", (1, 1), (0, 0, 0, 0)) 

    # حساب المربع المحيط (Bounding Box)
    y_min, x_min = coords.min(axis=0)[:2]  
    y_max, x_max = coords.max(axis=0)[:2]  
    
    # صندوق القص (left, upper, right, lower)
    bbox = (x_min, y_min, x_max + 1, y_max + 1)

    # قص الصورة الأصلية
    return img.crop(bbox)


# ----------------------------------------------------------------------------------
## دالة المعالجة الرئيسية المُعدَّلة: القص أولاً، ثم الإطار
# ----------------------------------------------------------------------------------

def add_border_and_trim(input_path: str, output_path: str, border_width_mm: float, max_size_cm: float) -> bool:
    """
    يقوم بمعالجة الصورة: قص الحواف، إضافة إطار أسود باستخدام MaxFilter، والقص النهائي.
    
    :param input_path: مسار ملف الصورة المدخل.
    :param output_path: مسار ملف الصورة المخرج.
    :param border_width_mm: سمك الإطار المطلوب بالمليمتر.
    :param max_size_cm: الحجم الأقصى المسموح به بعد المعالجة.
    :return: True إذا نجحت العملية، False إذا فشلت.
    """
    try:
        # تأكيد تحويل قيمة عرض الإطار إلى رقم عائم
        border_width_mm = float(border_width_mm)

        # 1. القراءة والتنظيف الأولي: التحويل إلى RGBA
        img = Image.open(input_path).convert('RGBA')
        
        # 2. 🚀 القص الدقيق للزوائد الشفافة أولاً
        img = trim_transparent_edges_numpy(img, ALPHA_THRESHOLD_TRIM)


        # 3. تطبيق الإطار الأسود (باستخدام MaxFilter)
        
        border_width_px = MM_TO_PIXELS(border_width_mm)
        if border_width_px <= 0: border_width_px = 1 # نضمن بيكسل واحد على الأقل

        # نحتاج لـ MaxFilter بحجم أكبر بيكسل واحد من ضعف عرض الإطار
        filter_size = border_width_px * 2 + 1
        
        alpha_channel = img.split()[-1]
        
        # استخدام مرشح MaxFilter لتوسيع القناع Alpha
        dilated_alpha = alpha_channel.filter(ImageFilter.MaxFilter(size=filter_size))
        
        # الحصول على الإطار نفسه عن طريق الفرق بين القناع الموسع والأصلي
        border_mask = ImageChops.difference(dilated_alpha, alpha_channel)
        
        # إنشاء صورة بلون الإطار (أسود)
        border_color_img = Image.new('RGBA', img.size, "black")
        
        # نستخدم القناع لإنشاء صورة الإطار فقط
        image_with_border = Image.new('RGBA', img.size)
        image_with_border = Image.composite(border_color_img, image_with_border, border_mask)
        
        # دمج الصورة الأصلية مع الإطار
        image_with_border = Image.alpha_composite(image_with_border, img)

        
        # 4. القص النهائي
        # هذا القص يضمن إزالة الحواف الشفافة أو شبه الشفافة التي قد تظهر بعد عملية دمج الإطار
        final_img = trim_transparent_edges_numpy(image_with_border, ALPHA_THRESHOLD_FINAL)
        
        # ----------------------------------------------------
        # --- وظائف إضافية محذوفة (التدوير وتحديد الحجم) ---
        # ----------------------------------------------------
        
        # 5. حفظ الصورة مع تضمين DPI
        dpi_value = (DPI, DPI) 
        final_img.save(output_path, 'PNG', dpi=dpi_value) 
        return True
        
    except Exception as e:
        # استخدام طباعة الخطأ إلى المجرى القياسي للخطأ (stderr)
        print(f"ERROR_PROCESSING: Python script failed due to: {e}", file=sys.stderr) 
        return False

# ----------------------------------------------------------------------------------
## تنفيذ العملية الرئيسية واستقبال المدخلات من سطر الأوامر
# ----------------------------------------------------------------------------------

if __name__ == "__main__":
    # يجب أن يستقبل 4 وسائط بالإضافة لاسم الملف نفسه (إجمالي 5)
    if len(sys.argv) < 5: 
        print("Usage: python contour.py <input_path> <output_path> <border_mm> <size_cm>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    border_width_mm = sys.argv[3] # يتم استقبال حجم الإطار كمعامل ثالث
    sticker_size_cm = sys.argv[4]

    # تمرير المعاملات المستلمة إلى دالة المعالجة
    if add_border_and_trim(input_path, output_path, border_width_mm, sticker_size_cm):
        # طباعة مسار المخرج عند النجاح (كما تتوقع سكربتات الرياكت عادةً)
        print(output_path) 
    else:
        sys.exit(1)