import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import SkeletonCard from '../../comp/SkeletonCard.jsx';

// --- The ProductCard component remains unchanged ---
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


// --- The main component with the new changes ---
const NewProductGrid = () => {
    const [searchParams] = useSearchParams();
    
    const category = searchParams.get('category');
    const subcats = searchParams.get('subcats');
    const mainCategory = searchParams.get('mainCategory');
    const searchQuery = searchParams.get('recherche');

    const [stickers, setStickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true); // Changed initial state
    const [totalStickers, setTotalStickers] = useState(0);

    const observer = useRef();
    const lastStickerElementRef = useCallback(node => {
        // Only proceed if loading is not in progress and there are more items to load
        if (loading || !hasMore) return; 
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            // Check if the last element is intersecting
            if (entries[0].isIntersecting) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]); // Dependencies are loading and hasMore

    useEffect(() => {
        setStickers([]);
        setPage(1);
        setHasMore(true); // Reset hasMore when parameters change
    }, [category, subcats, searchQuery]);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            setError(null);
            const limit = 10;
            let url = '';

            if (searchQuery) {
                url = `http://localhost:3002/search/products?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`;
            } else if (subcats) {
                url = `http://localhost:3002/items/all?subcats=${encodeURIComponent(subcats)}&page=${page}&limit=${limit}`;
            } else {
                const currentCategory = category || 'All';
                url = `http://localhost:3002/items/${currentCategory}?page=${page}&limit=${limit}`;
            }

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                setTotalStickers(data.total);
                setStickers(prevStickers => {
                    const newItems = data.items.filter(
                        item => !prevStickers.some(s => s._id === item._id)
                    );
                    return [...prevStickers, ...newItems];
                });
                
                // Set hasMore to false if the number of items received is less than the limit
                setHasMore(data.items.length === limit);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        // Fetch items only if hasMore is true, or if it's the first page
        if (hasMore || page === 1) {
            fetchItems();
        }
        
    }, [category, subcats, searchQuery, page, hasMore]);

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
                {loading && page === 1 ? (
                    Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)
                ) : (
                    stickers.map((product, index) => (
                        <ProductCard
                            key={product._id}
                            product={product}
                            isLast={stickers.length === index + 1}
                            lastStickerElementRef={lastStickerElementRef}
                        />
                    ))
                )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem', height: '50px' }}>
                {loading && page > 1 && <p>Loading more...</p>}
                {!hasMore && stickers.length > 0 && <p>You've seen all the results!</p>}
            </div>
            <br /><br /><br /><br />
        </div>
    );
};

export default NewProductGrid;