// src/pages/product/NewProductGrid.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import SkeletonCard from '../../comp/SkeletonCard.jsx';

// --- مكون ProductCard يبقى كما هو بدون تغيير ---
const ProductCard = ({ product, isLast, lastStickerElementRef }) => {
    const [cartItemIds, setCartItemIds] = useState(new Set());
    const [justAddedId, setJustAddedId] = useState(null);
    const PARTICLE_COUNT = 8;

    const loadCartStatus = useCallback(() => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const sizeWithUnit = `${product.size || '6'} CM`;
        const cartId = `${product._id}-${sizeWithUnit}`;
        const ids = new Set(cart.map(item => `${item._id}-${item.size}`));
        setCartItemIds(ids);
    }, [product._id, product.size]);

    useEffect(() => {
        loadCartStatus();
        window.addEventListener('storage', loadCartStatus);
        return () => window.removeEventListener('storage', loadCartStatus);
    }, [loadCartStatus]);

    const handleAddToCart = (event, productToAdd) => {
        event.stopPropagation();
        event.preventDefault();

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const sizeWithUnit = `${productToAdd.size || '6'} CM`;
        const cartId = `${productToAdd._id}-${sizeWithUnit}`;
        const existingProductIndex = cart.findIndex(item => item._id === productToAdd._id && item.size === sizeWithUnit);

        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += 1;
            toast.success('Quantity updated!');
        } else {
            cart.push({
                ...productToAdd,
                quantity: 1,
                size: sizeWithUnit,
                price: productToAdd.price || '0.50 DT',
                originalPrice: productToAdd.originalPrice || '1.00 DT'
            });
            toast.success('Product added to cart!');
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('storage'));

        setJustAddedId(cartId);
        setTimeout(() => setJustAddedId(null), 1000);
    };

    const sizeWithUnit = `${product.size || '6'} CM`;
    const cartId = `${product._id}-${sizeWithUnit}`;
    const isInCart = cartItemIds.has(cartId);
    const wasJustAdded = justAddedId === cartId;

    const displayPrice = product.price || '0.50 DT';
    const displayOriginalPrice = product.originalPrice || '1.00 DT';

    return (
        <Link
            ref={isLast ? lastStickerElementRef : null}
            to="/ProductDetail"
            state={{ productData: product }}
            className="pro-sticker-card"
        >
            <div className='badge_sold'>Up To 50%</div>
            <div className="card-glow"></div>
            <div className="pro-image-container">
                <img src={product.image} alt={product.title} className="pro-sticker-image" />
            </div>
            <div className="card-body">
                <p className="titre_card">{product.title}</p>
                <div className="price-and-cart">
                    <div className="pro-pricing">
                        <span className="pro-current-price">{displayPrice}</span>
                        <span className="pro-original-price">{displayOriginalPrice}</span>
                    </div>
                    <div className={`pro-add-to-cart-btn-wrapper ${wasJustAdded ? 'animate-particles' : ''}`}>
                        <button
                            type="button"
                            className="pro-add-to-cart-btn_product"
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={isInCart}
                        >
                            {isInCart ? <FaCheckCircle /> : <FaShoppingCart />}
                        </button>
                        {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
                            <div key={index} className="particle"></div>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    );
};


// --- المكون الرئيسي مع التعديلات الجديدة ---
const NewProductGrid = () => {
    const [searchParams] = useSearchParams();
    
    // ✨ 1. قراءة جميع الـ parameters الممكنة من الرابط
    const category = searchParams.get('category');
    const subcats = searchParams.get('subcats'); // لقائمة الفئات
    const mainCategory = searchParams.get('mainCategory'); // لعنوان الصفحة
    const searchQuery = searchParams.get('recherche');

    const [stickers, setStickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalStickers, setTotalStickers] = useState(0);

    const observer = useRef();
    const lastStickerElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // ✨ 2. إعادة تعيين الحالة عند تغيير أي من الـ parameters الأساسية
    useEffect(() => {
        setStickers([]);
        setPage(1);
    }, [category, subcats, searchQuery]);

    // جلب المنتجات من الـ API
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            setError(null);
            const limit = 10;
            let url = '';

            // ✨ 3. تحديث منطق بناء رابط الـ API
            if (searchQuery) {
                // منطق البحث (بدون تغيير)
                url = `https://smily-la3j.vercel.app/search/products?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`;
            } else if (subcats) {
                // منطق جديد: إذا وجد 'subcats'، قم ببناء الرابط باستخدامه
                // نستخدم "all" كـ placeholder في المسار لأن الـ query string هو المهم
                url = `https://smily-la3j.vercel.app/items/all?subcats=${encodeURIComponent(subcats)}&page=${page}&limit=${limit}`;
            } else {
                // العودة للمنطق الأصلي الخاص بالفئة الواحدة
                const currentCategory = category || 'All';
                url = `https://smily-la3j.vercel.app/items/${currentCategory}?page=${page}&limit=${limit}`;
            }

            try {
                const response = await fetch(url);
                const data = await response.json();
                
                setTotalStickers(data.total);
                setStickers(prevStickers => {
                    const existingIds = new Set(prevStickers.map(s => s._id));
                    const newItems = data.items.filter(item => !existingIds.has(item._id));
                    return [...prevStickers, ...newItems];
                });
                setHasMore((page * limit) < data.total);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchItems();
    }, [category, subcats, searchQuery, page]); // ✨ 4. إضافة subcats إلى مصفوفة الـ dependencies

    // ✨ 5. تحديث دالة تحديد العنوان
    const getTitle = () => {
        if (searchQuery) {
            return `Search Results for: "${searchQuery}"`;
        }
        if (mainCategory) {
            return `Category: All ${mainCategory}`;
        }
        return `Category: ${category || 'All'}`;
    };

    return (
        <div className="showcase-container">
            <div className='titre_category'>
                <p>{getTitle()}</p>
                <p>Results: <span style={{ fontWeight: "700" }}>{totalStickers}</span></p>
            </div>
            
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            <div className="showcase-grid">
                {/* عرض كروت الانتظار عند التحميل الأول */}
                {loading && page === 1 ? (
                    Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)
                ) : (
                    stickers.map((product, index) => (
                        <ProductCard
                            key={`${product._id}-${index}`} // مفتاح فريد لتجنب المشاكل
                            product={product}
                            isLast={stickers.length === index + 1}
                            lastStickerElementRef={lastStickerElementRef}
                        />
                    ))
                )}
            </div>

            {/* عرض رسائل التحميل أو نهاية النتائج */}
            <div style={{ textAlign: 'center', marginTop: '2rem', height: '50px' }}>
                {loading && page > 1 && <p>Loading more...</p>}
                {!hasMore && stickers.length > 0 && <p>You've seen all the results!</p>}
            </div>
            <br /><br /><br /><br />
        </div>
    );
};

export default NewProductGrid;