import React, { useRef, useEffect, useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import { categoryData } from "../../choix/choix.jsx";

// دالة لخلط عناصر المصفوفة بشكل عشوائي (Fisher-Yates shuffle)
// توضع خارج المكون لأنها لا تعتمد على أي شيء بداخله
const shuffleArray = (array) => {
    let currentIndex = array.length;
    const newArray = [...array]; // إنشاء نسخة لتجنب تعديل المصفوفة الأصلية
    
    // بينما لا يزال هناك عناصر للخلط
    while (currentIndex !== 0) {
        // اختر عنصرًا متبقيًا
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // وقم بتبديله مع العنصر الحالي
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
};


const CategoryScroller = () => {
    const scrollContainerRef = useRef(null);
    const [searchParams] = useSearchParams();
    const activeCategory = searchParams.get('category');

    // 1. (بدون تغيير) إنشاء القائمة الكاملة والفريدة من البيانات
    const scrollerCategories = useMemo(() => {
        const allSubCategories = categoryData.flatMap(cat => cat.subCategories || []);
        const uniqueSubCategories = [...new Set(allSubCategories)];
        return ['All', ...uniqueSubCategories];
    }, []);

    // 2. حالة جديدة لتخزين القائمة التي سيتم عرضها بعد إعادة الترتيب والخلط
    const [displayedCategories, setDisplayedCategories] = useState([]);

    // حالات التحكم بالتمرير
    const [scrollProgress, setScrollProgress] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // 3. useEffect لإعادة ترتيب القائمة وخلطها عند تغيير الفئة النشطة
    useEffect(() => {
        // تحديد الفئة التي يجب أن تكون في المقدمة
        const currentTopCategory = activeCategory || 'All';
        
        // إنشاء قائمة بباقي الفئات (كل الفئات ما عدا الفئة النشطة)
        const remainingCategories = scrollerCategories.filter(c => c !== currentTopCategory);
        
        // خلط باقي الفئات بشكل عشوائي
        const shuffledRemaining = shuffleArray(remainingCategories);

        // إنشاء القائمة النهائية بوضع الفئة النشطة أولاً
        const finalOrderedList = [currentTopCategory, ...shuffledRemaining];

        // تحديث الحالة لعرض القائمة الجديدة
        setDisplayedCategories(finalOrderedList);

    }, [activeCategory, scrollerCategories]); // يتم التشغيل عند التحميل أو عند تغيير الرابط


    // --- دوال التحكم بالتمرير ---
    const checkScrollability = () => {
        const el = scrollContainerRef.current;
        if (el) {
            const { scrollLeft, scrollWidth, clientWidth } = el;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < (scrollWidth - clientWidth - 1));
        }
    };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollWidth - clientWidth > 0) {
        const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
        setScrollProgress(progress);
      }
      checkScrollability();
    }
  };
    
    const scrollHorizontally = (amount) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            checkScrollability();
            el.addEventListener('scroll', handleScroll);
            window.addEventListener('resize', checkScrollability); // استخدام checkScrollability للتحديث عند تغيير الحجم
            
            return () => {
                el.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', checkScrollability);
            };
        }
    }, [displayedCategories]); // إعادة التحقق عند تغير محتوى الشريط


    return (
        <div className="scroller-wrapper">
            <div className="scroller-inner">
                <button 
                    className={`scroll-arrow left ${!canScrollLeft ? 'disabled' : ''}`}
                    onClick={() => scrollHorizontally(-300)}
                    aria-label="Scroll left"
                >
                    <FiChevronLeft />
                </button>

                <div 
                    className="scroller-content" 
                    ref={scrollContainerRef}
                >
                    {/* 4. استخدام القائمة الجديدة المعروضة (displayedCategories) */}
                    {displayedCategories.map((category) => (
                        <Link 
                            to={`/product?category=${encodeURIComponent(category)}`}
                            key={category} // استخدام اسم الفئة كمفتاح فريد
                            className={`category-chip ${(activeCategory || 'All') === category ? 'active' : ''}`}
                        >
                            {category}
                        </Link>
                    ))}
                </div>
                
                <button 
                    className={`scroll-arrow right ${!canScrollRight ? 'disabled' : ''}`}
                    onClick={() => scrollHorizontally(300)}
                    aria-label="Scroll right"
                >
                    <FiChevronRight />
                </button>
            </div>

            <div className="progress-bar-container">
                <div 
                    className="progress-bar-indicator" 
                    style={{ width: `${scrollProgress}%` }}
                ></div>
            </div>
        </div>
    );
};

export default CategoryScroller;