import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SkeletonCard from '.././comp/SkeletonCard'; // تأكد من صحة المسار

// ... باقي استيراداتك
// Import Icons
import { FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import { FiMinus, FiPlus, FiTruck,FiRefreshCw  } from 'react-icons/fi';
import Navbar from '../comp/navbar';

// ProductDetail Component
const ProductDetail = () => {
  const location = useLocation();
  const { productData } = location.state || {};

  // States for the main product
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('6 CM');
  const [cart, setCart] = useState([]);
  const [justAddedItem, setJustAddedItem] = useState(null);

  // States for Infinite Scroll
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

// --- ✅ 1. THE FIX: Trust the data passed from the cart ---
// This effect now correctly uses the SPECIFIC item data (including size and quantity)
// that was passed from the ShoppingCart link.
useEffect(() => {
    // These lines are for resetting when you navigate to a new product
    setRelatedProducts([]);
    setPage(1);
    setHasMore(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // If productData was passed (i.e., you clicked a link)
    if (productData) {
        // Use the size and quantity from the EXACT item you clicked on.
        // Provide a default fallback just in case.
        setSelectedSize(productData.size || '6 CM');
        setQuantity(productData.quantity || 1);
    }
    
// This effect should ONLY re-run when you navigate to a completely different product.
}, [productData]);

  // --- ✅ 2. NEW LOGIC: Update quantity when the user selects a DIFFERENT size ---
  useEffect(() => {
    if (productData) {
        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
        // Find the specific product variant (ID + size) in the cart
        const specificVariantInCart = currentCart.find(item => item._id === productData._id && item.size === selectedSize);

        if (specificVariantInCart) {
            // If this specific size is in the cart, update the quantity to match
            setQuantity(specificVariantInCart.quantity);
        } else {
            // If the user selects a size that is NOT in the cart, reset quantity to 1
            setQuantity(1);
        }
    }
  }, [selectedSize]); // This effect ONLY depends on selectedSize


  // Effect for fetching related products
// Effect for fetching related products
useEffect(() => {
  if (!productData || !productData.category) return;

  const fetchRelated = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const limit = 10;
      const response = await fetch(`http://localhost:3002/items/${productData.category}?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Could not fetch related products.');
      
      const data = await response.json();
      const filteredProducts = data.items.filter(item => item._id !== productData._id);

      // --- ✅ THE FIX: De-duplicate products before setting state ---
      setRelatedProducts(prevProducts => {
        // 1. Combine the old list with the new one
        const allProducts = [...prevProducts, ...filteredProducts];
        
        // 2. Use a Map to ensure each product ID is unique.
        // This creates a collection where each key (_id) can only exist once.
        const uniqueProductsMap = new Map();
        allProducts.forEach(p => uniqueProductsMap.set(p._id, p));
        
        // 3. Convert the Map values back to an array
        return Array.from(uniqueProductsMap.values());
      });

      setHasMore((page * limit) < data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // We only call fetchRelated if we are on page 1 for a new product,
  // or if the page number changes for infinite scroll.
  if (page === 1 && relatedProducts.length === 0) {
      fetchRelated();
  } else if (page > 1) {
      fetchRelated();
  }
}, [page, productData]);



  // Effect for handling infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100 ||
        isLoading ||
        !hasMore
      ) {
        return;
      }
      setPage(prevPage => prevPage + 1);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore]);

  // Effect for loading cart state
  useEffect(() => {
    const loadCartState = () => {
      const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCart(currentCart);
    };
    loadCartState();
    window.addEventListener('storage', loadCartState);
    return () => {
      window.removeEventListener('storage', loadCartState);
    };
  }, []);

  const pricePerUnit = useMemo(() => {
    if (!productData) return 0;
    switch (selectedSize) {
      case '8 CM': return 0.8;
      case '10 CM': return 1.2;
      default: return 0.5; // Default price
    }
  }, [selectedSize, productData]);

  const handleQuantityChange = (amount) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

const handleAddToCart = (product) => {
  const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
  
  const formattedSize = `${parseInt(selectedSize)} CM`;

  const existingProductIndex = currentCart.findIndex(item => item._id === product._id && item.size === formattedSize);
  
  const productToAdd = {
    ...product,
    quantity: quantity,
    size: formattedSize,
    price: `${pricePerUnit.toFixed(2)} DT`,
    originalPrice: `${(pricePerUnit * 2).toFixed(2)} DT`,
  };

  if (existingProductIndex > -1) {
    // --- ✅ تمت عملية التحديث ---
    currentCart[existingProductIndex] = productToAdd;
    toast.success('Cart updated successfully!'); // رسالة التحديث
  } else {
    // --- ✅ تمت عملية الإضافة ---
    currentCart.push(productToAdd);
    toast.success('Product added to cart!'); // رسالة الإضافة
  }

  localStorage.setItem('cart', JSON.stringify(currentCart));
  setCart(currentCart); 
  window.dispatchEvent(new Event('storage'));
  
  // ملاحظة: لم نعد بحاجة إلى justAddedItem مع وجود الإشعارات
  // لكن يمكنك إبقاءه إذا أردت
  setJustAddedItem({ id: product._id, size: formattedSize });
  setTimeout(() => setJustAddedItem(null), 2000);
};

  if (!productData) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', marginTop: '150px' }}>
          <h2>Product not found!</h2>
          <Link to="/">Go back to Home</Link>
        </div>
      </>
    );
  }

  // --- ✅ FINAL FIX: Unify the size format everywhere ---

// 1. Create the correctly formatted size string ONCE.
const formattedSize = `${parseInt(selectedSize)} CM`;

// 2. Use this formattedSize for ALL checks.
const itemInCart = cart.find(item => item._id === productData._id && item.size === formattedSize);
const isMainInCart = !!itemInCart;

const isQuantityUnchanged = isMainInCart && itemInCart.quantity === quantity;

// Also use formattedSize for the "just added" check.
const wasMainJustAdded = justAddedItem?.id === productData._id && justAddedItem?.size === formattedSize;

const totalPrice = (pricePerUnit * quantity).toFixed(2);
const totalOriginalPrice = (pricePerUnit * 2 * quantity).toFixed(2);

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '150px' }}>
        <div className="product-page-container">
          <section className="product-image-section">
            <div className="sale-badge">Up to 50%</div>
            <img src={productData.image} alt={productData.title} className="main-product-image" />
          </section>
          <section className="product-info-section">
            <h1 className="product-title">{productData.title}</h1>
            <div className="stock-status">
              <BsCheckCircleFill />
              <span>In Stock</span>
            </div>
            <div className="price-section">
              <span className="pro-current-price_info">{totalPrice} DT</span>
              <span className="original-price">{totalOriginalPrice} DT</span>
            </div>
            <div className="product-options">
              <div className="form-group">
                <label htmlFor="size-select">Size</label>
                <select 
                  id="size-select" 
                  className="size-selector"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <option value="6 CM">6 CM</option>
                  <option value="8 CM">8 CM</option>
                  <option value="10 CM">10 CM</option>
                </select>
              </div>
              <div className="form-group_product">
                <label>Quantity</label>
                <div className="quantity-control_product">
                  <button onClick={() => handleQuantityChange(-1)}>-</button>
                  <input type="text" value={quantity} readOnly />
                  <button onClick={() => handleQuantityChange(1)}>+</button>
                </div>
              </div>
            </div>
<button 
  className="add-to-cart-btn"
  onClick={() => handleAddToCart(productData)}
  disabled={(isMainInCart && isQuantityUnchanged) || wasMainJustAdded}
>
  
  {/* --- ✅ NEW ICON LOGIC: أيقونة ثلاثية الحالات --- */}
  {
    !isMainInCart
      ? <FaShoppingCart />  // أيقونة عربة التسوق
      : isQuantityUnchanged
        ? <FaCheckCircle />   // أيقونة علامة الصح
        : <FiRefreshCw />     // أيقونة التحديث الجديدة
  }

  {/* --- منطق النص الثلاثي الحالات (كما هو) --- */}
  {
    !isMainInCart
      ? 'Add To Cart'
      : isQuantityUnchanged
        ? 'In Cart'
        : 'Update Cart'
  }
</button>
            <div className="shipping-info">
              <FiTruck />
              <span>Free shipping on orders over 30 DT</span>
            </div>
          </section>
        </div>
        
        <br /><br /><br /><br /><br /><br />
        
  <div className="showcase-container">
  <h1>You May Also Like</h1>
  <div className="showcase-grid">
    {/* This part stays the same: it renders the products you already have */}
    {relatedProducts.map((product) => (
      <ProductCard key={`${product._id}-${product.size}`} product={product} cart={cart} />
    ))}

    {/* This is the new part: it renders 4 skeleton cards ONLY when loading the next batch */}
    {isLoading && (
      Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={`skeleton-${index}`} />
      ))
    )}
  </div>

  {/* We no longer need the "Loading more..." text, but we keep the other messages */}
  {!hasMore && relatedProducts.length > 0 && <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>You've seen all related stickers!</p>}
  {error && <p style={{textAlign: 'center', color: 'red'}}>Error: {error}</p>}
</div>
      </div>
     <br /><br /><br /><br /><br />
    </>
  );
};


// --- ProductCard Component (No changes were needed here) ---
const ProductCard = ({ product, cart }) => {
    const [justAdded, setJustAdded] = useState(false);
    
   const handleCardAddToCart = (event, productToAdd) => {
    event.stopPropagation();
    event.preventDefault(); 
    
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const sizeWithUnit = `${productToAdd.size || '6'} CM`;

    const existingIndex = currentCart.findIndex(
        item => item._id === productToAdd._id && item.size === sizeWithUnit
    );

    if (existingIndex > -1) {
        // --- ✅ تمت زيادة الكمية ---
        currentCart[existingIndex].quantity += 1;
        toast.success('Quantity updated!'); // رسالة تحديث الكمية
    } else {
        // --- ✅ تمت إضافة منتج جديد ---
        currentCart.push({ 
            ...productToAdd, 
            quantity: 1, 
            size: sizeWithUnit,
            price: productToAdd.price || '0.50 DT',
            originalPrice: productToAdd.originalPrice || '1.00 DT'
        });
        toast.success('Product added to cart!'); // رسالة الإضافة
    }

    localStorage.setItem('cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('storage'));
    
    // لم نعد بحاجة لهذا، فالإشعار يقوم بالمهمة بشكل أفضل
    setJustAdded(true);
    // setTimeout(() => setJustAdded(false), 2000);
};
    
    const sizeWithUnit = `${product.size || '6'} CM`;
    const isInCart = cart.some(
        item => item._id === product._id && item.size === sizeWithUnit
    );

    return (
        <Link to="/ProductDetail" state={{ productData: product }} className="pro-sticker-card">
        
            <div className="badge_sold">Up to 50%</div>
            <div className="card-glow"></div>
            <div className="pro-image-container">
                <img src={product.image} alt={product.title} className="pro-sticker-image" />
            </div>
            <div className="card-body">
                <p className="titre_card">{product.title}</p>
                <div className="price-and-cart">
                    <div className="pro-pricing">
                        <span className="pro-current-price">{product.price || '0.50 DT'}</span>
                        <span className="pro-original-price">{product.originalPrice || '1.00 DT'}</span>
                    </div>
                    <button 
                        type="button"
                        className="pro-add-to-cart-btn_product"
                        onClick={(e) => handleCardAddToCart(e, product)}
                        disabled={isInCart || justAdded}
                    >
                        {isInCart || justAdded ? <FaCheckCircle /> : <FaShoppingCart />}
                    </button>
                </div>
            </div>
        </Link>
    );
};

export default ProductDetail;