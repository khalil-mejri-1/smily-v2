import React, { useState, useRef } from 'react';

// الطول المستهدف بالوحدة المطلوبة (6cm). 
// نستخدم 226.77 بكسل لأن 1cm يُقدر بـ 37.795 بكسل تقريبًا (72 DPI).
// 6cm * 37.795 = 226.77px
const TARGET_HEIGHT_PX = 226.77; 

const ImageResizerDownloader = () => {
  const [imageURL, setImageURL] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const imageRef = useRef(null); // Reference to the displayed <img> element

  // 1. معالجة رفع الملف
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageURL(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. معالجة تحميل (تنزيل) الصورة بالحجم الجديد
  const handleDownload = () => {
    if (!imageURL || !imageRef.current) return;

    // إنشاء كائن صورة جديد لمعالجة الأبعاد
    const img = new Image();
    img.src = imageURL;
    
    img.onload = () => {
      // حساب الأبعاد الجديدة للحفاظ على نسبة العرض إلى الارتفاع
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      // حساب العرض الجديد بناءً على الطول الثابت (6 سم)
      const newHeight = TARGET_HEIGHT_PX;
      const newWidth = (originalWidth / originalHeight) * newHeight;

      // إنشاء عنصر Canvas (اللوحة)
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      // رسم الصورة على اللوحة بالأبعاد الجديدة
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // تحويل محتوى اللوحة إلى رابط بيانات (Data URL) ثم إلى "Blob"
      canvas.toBlob((blob) => {
        if (blob) {
          // إنشاء رابط تنزيل
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `resized_image_6cm_${originalFile.name}`; // اسم الملف للتنزيل
          
          // تشغيل التنزيل
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url); // تحرير الذاكرة
        }
      }, originalFile.type); // استخدم النوع الأصلي للملف (مثل image/jpeg)
    };
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ marginBottom: '15px' }}
      />
      
      {/* عرض الصورة مع خاصية CSS لتوضيح الحجم المرئي */}
      {imageURL && (
        <div style={{ marginTop: '20px' }}>
          <h3>معاينة الصورة (طولها في العرض 6 سم):</h3>
          <img
            ref={imageRef} // الإشارة إلى هذا العنصر
            src={imageURL}
            alt="Uploaded Preview"
            style={{
              height: '6cm', // العرض المرئي في المتصفح هو 6 سم
              width: 'auto',  
              border: '2px dashed #007bff',
              objectFit: 'contain' 
            }}
          />
          
          <hr style={{ margin: '20px 0' }} />
          
          {/* زر تحميل (تنزيل) الصورة بالحجم الجديد */}
          <button onClick={handleDownload} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            📥 تحميل الصورة بحجم (6 سم)
          </button>
        </div>
      )}

      {!imageURL && <p>الرجاء رفع صورة للمتابعة.</p>}
    </div>
  );
};

export default ImageResizerDownloader;