import React, { useState, useEffect, useRef } from 'react';


import myVideo1 from './../public/vd/vd1.webm';
import myVideo2 from './../public/vd/vd2.webm';
import myVideo3 from './../public/vd/vd3.webm'; 




import posterImage1 from './../public/img1.png';
import posterImage2 from './../public/img2.png';
import posterImage3 from './../public/img3.png';

// --- تنظيم مصادر الفيديوهات ---
const videoSources = [
  { src: myVideo1, poster: posterImage1 },
  { src: myVideo2, poster: posterImage2 },
  { src: myVideo3, poster: posterImage3 },
];

// --- 1. دالة لخلط القائمة (Fisher-Yates Shuffle Algorithm) ---
// هذه الدالة ستعيد ترتيب الفيديوهات بشكل عشوائي
const shuffleArray = (array) => {
  const newArray = [...array]; // ننسخ القائمة الأصلية لتجنب تعديلها
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // تبديل العناصر
  }
  return newArray;
};


const VideoPlayer = () => {
  const videoRef = useRef(null);
  
  // --- 2. إعداد الحالة (State) ---
  // `playlist`: تحتوي على ترتيب الفيديوهات العشوائي (مثلاً: [2, 0, 1])
  // `currentPosition`: تتبع موقعنا الحالي في قائمة التشغيل العشوائية (يبدأ من 0)
  const [playlist, setPlaylist] = useState(() => shuffleArray(videoSources));
  const [currentPosition, setCurrentPosition] = useState(0);


  // --- 3. دالة تُستدعى عند انتهاء الفيديو ---
  const handleVideoEnd = () => {
    const isLastVideo = currentPosition >= playlist.length - 1;

    if (isLastVideo) {
      // إذا كان هذا آخر فيديو في القائمة العشوائية
      // نقوم بإنشاء قائمة عشوائية جديدة ونعود إلى البداية
      console.log("Playlist finished. Shuffling a new one.");
      setPlaylist(shuffleArray(videoSources));
      setCurrentPosition(0);
    } else {
      // إذا لم يكن الأخير، ننتقل ببساطة إلى الفيديو التالي في القائمة
      setCurrentPosition(prevPosition => prevPosition + 1);
    }
  };

  // --- 4. التأثير (Effect) الذي يشغل الفيديو الجديد ---
  // يعمل هذا الكود كلما تغير الفيديو الحالي
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.log("Autoplay was prevented: ", error);
      });
    }
  }, [currentPosition, playlist]); // نراقب التغير في الفيديو الحالي أو في قائمة التشغيل كلها

  
  // --- 5. عرض المكون ---
  // نحدد الفيديو الحالي من قائمة التشغيل العشوائية
  const currentVideo = playlist[currentPosition];

  return (
    <div className="video-container">
      <video
        key={currentVideo.src} // إضافة `key` تساعد React على تحديث العنصر بشكل صحيح
        ref={videoRef}
        poster={currentVideo.poster}
        onEnded={handleVideoEnd}
        autoPlay
        muted
        playsInline
        loading="lazy"
        className="fill-parent-video"
      >
        <source src={currentVideo.src} type="video/mp4" />
        عذرًا، متصفحك لا يدعم عرض الفيديوهات.
      </video>

    </div>
  );
};

export default VideoPlayer;


