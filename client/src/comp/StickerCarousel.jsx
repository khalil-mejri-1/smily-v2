import React, { useState, useEffect } from "react";
import { FaShoppingCart, FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom"; // لم يكن مستخدماً, تم تفعيله الآن
import toast from 'react-hot-toast';

// بيانات وهمية للملصقات
const allStickers = [
  { _id: 1, name: "Kakashi Reading", price: "0.5 DT", originalPrice: "1.0 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 2, name: "Gojo Satoru", price: "0.7 DT", originalPrice: "1.2 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 3, name: "Sleepy Kirby", price: "0.4 DT", originalPrice: "0.8 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 4, name: "Anya Forger", price: "0.6 DT", originalPrice: "1.0 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 5, name: "Rengoku Flame", price: "0.8 DT", originalPrice: "1.5 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 6, name: "Itachi Crow", price: "0.7 DT", originalPrice: "1.0 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 7, name: "Gamer Cat", price: "0.5 DT", originalPrice: "1.0 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 8, name: "Tanjiro Water", price: "0.8 DT", originalPrice: "1.5 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 9, name: "Deadpool Heart", price: "0.6 DT", originalPrice: "1.2 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 10, name: "Sad Pepe", price: "0.3 DT", originalPrice: "0.6 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 11, name: "Sharingan Eye", price: "0.9 DT", originalPrice: "1.5 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
  { _id: 12, name: "Pikachu Wave", price: "0.5 DT", originalPrice: "1.0 DT", image: "https://ih1.redbubble.net/image.5766198643.4406/st,small,507x507-pad,600x600,f8f8f8.jpg" },
];

const ProStickerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationState, setAnimationState] = useState("enter");
  const [isPaused, setIsPaused] = useState(false);
  const [cartItemIds, setCartItemIds] = useState(new Set());
  const [justAddedIds, setJustAddedIds] = useState([]);

  const loadCartIds = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const ids = new Set(cart.map((item) => item._id));
    setCartItemIds(ids);
  };

  useEffect(() => {
    loadCartIds();
    window.addEventListener("storage", loadCartIds);
    return () => {
      window.removeEventListener("storage", loadCartIds);
    };
  }, []);

const handleAddToCart = (event, productToAdd) => {
    event.stopPropagation();
    event.preventDefault();

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingProductIndex = cart.findIndex(
        (item) => item._id === productToAdd._id
    );

    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += 1;
        toast.success('Quantity updated!'); // ✅ رسالة التحديث
    } else {
        cart.push({ ...productToAdd, quantity: 1 });
        toast.success('Product added to cart!'); // ✅ رسالة الإضافة
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));

    // يمكنك الآن إزالة الأسطر التالية لأن الإشعارات كافية
    setJustAddedIds((prev) => [...prev, productToAdd._id]);
 
};

  useEffect(() => {
    if (isPaused) {
      return;
    }
    const timer = setInterval(() => {
      setAnimationState("exit");
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 6) % allStickers.length);
        setAnimationState("enter");
      }, 800);
    }, 3000);

    return () => clearInterval(timer);
  }, [isPaused]);

  // التأكد من أن slice يعمل بشكل صحيح حتى لو وصل للنهاية
  const getVisibleStickers = () => {
    const end = currentIndex + 6;
    if (end > allStickers.length) {
        return allStickers.slice(currentIndex).concat(allStickers.slice(0, end - allStickers.length));
    }
    return allStickers.slice(currentIndex, end);
  };
  
  const visibleStickers = getVisibleStickers();

  return (
    <section className="pro-carousel-section">
      <div className="carousel-header">
        <h2>Popular Stickers</h2>
        <p>Browse our most stickers</p>
      </div>
      <div
        className={`pro-sticker-grid ${animationState}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {visibleStickers.map((sticker, index) => {
          // تصحيح: استخدام 'sticker' بدلاً من 'product'
          const isInCart = cartItemIds.has(sticker._id);
          const wasJustAdded = justAddedIds.includes(sticker._id);
          
          return (
            // تصحيح: تحويل البطاقة إلى رابط Link
            <Link
              to="/ProductDetail"
              state={{ productData: sticker }} // إرسال بيانات المنتج للصفحة التالية
              className="pro-sticker-card"
              key={sticker._id} // تصحيح: استخدام _id للمفتاح
              style={{ "--delay": `${index * 100}ms` }}
            >
              <div className="badge_sold">Up To 50%</div>
              <div className="card-glow"></div>
              <div className="pro-image-container">
                <img
                  src={sticker.image}
                  alt={sticker.name}
                  className="pro-sticker-image"
                />
              </div>
              <div className="card-body">
                <p className="titre_card">{sticker.name}</p>
                <div className="price-and-cart">
                  <div className="pro-pricing">
                    <span className="pro-current-price">{sticker.price}</span>
                    <span className="pro-original-price">{sticker.originalPrice}</span>
                  </div>
                  <button
                    type="button" // مهم لمنع الزر من تفعيل الرابط
                    className="pro-add-to-cart-btn_product"
                    onClick={(e) => handleAddToCart(e, sticker)} // تصحيح: استخدام sticker
                    disabled={isInCart || wasJustAdded}
                  >
                    {isInCart || wasJustAdded ? <FaCheckCircle /> : <FaShoppingCart />}
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ProStickerCarousel;