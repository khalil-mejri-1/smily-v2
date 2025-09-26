import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiMinus,
  FiTrash2,
  FiShoppingCart,
  FiInfo,
  FiUpload,
  FiX,
  FiCheckCircle, // 1. تم استيراد أيقونة النجاح
} from "react-icons/fi";
import Navbar from "../comp/navbar";
import toast from "react-hot-toast";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState({ count: 0, price: 0 });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [removingItems, setRemovingItems] = useState(new Set());
  const [errors, setErrors] = useState({ name: null, phone: null });

  // --- حالات التنبيهات والنوافذ المنبثقة ---
  const [showOrderRestriction, setShowOrderRestriction] = useState(false);
  const [orderSuccessMessageVisible, setOrderSuccessMessageVisible] = useState(false); // 2. حالة جديدة لرسالة النجاح

  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCart);

    const handleStorageChange = () => {
      const updatedStoredCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(updatedStoredCart);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price);
      return sum + price * item.quantity;
    }, 0);
    setCartTotal({ count: totalCount, price: totalPrice.toFixed(2) });

    if (totalCount >= 15 || totalPrice >= 7.5) {
      setShowOrderRestriction(false);
    }
  }, [cartItems]);

  const updateCartAndStorage = (newItems) => {
    setCartItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
    window.dispatchEvent(new Event("storage"));
  };

  const handleQuantityChange = (productId, productSize, amount) => {
    const newItems = cartItems.map((item) =>
      item._id === productId && item.size === productSize
        ? { ...item, quantity: Math.max(1, item.quantity + amount) }
        : item
    );
    updateCartAndStorage(newItems);
  };

  const handleRemoveItem = (productId, productSize) => {
    const itemKey = `${productId}-${productSize}`;
    const animationDuration = 500;
    setRemovingItems((prev) => new Set(prev).add(itemKey));
    toast.error("Item removed from cart");
    setTimeout(() => {
      const newItems = JSON.parse(localStorage.getItem("cart") || "[]").filter(
        (item) => !(item._id === productId && item.size === productSize)
      );
      updateCartAndStorage(newItems);
      setRemovingItems((prev) => {
        const updatedSet = new Set(prev);
        updatedSet.delete(itemKey);
        return updatedSet;
      });
    }, animationDuration);
  };

  // 3. ✨ تم تعديل دالة إرسال الطلب
  const submitOrder = async (reviewId = null) => {
    setIsSubmitting(true);
    const orderData = {
      customerName: name,
      customerPhone: phone,
      items: cartItems.map((item) => ({
        productId: item._id,
        title: item.title,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
        image: item.image,
      })),
      totalPrice: cartTotal.price,
      orderDate: new Date().toISOString(),
    };
    if (reviewId) orderData.review = reviewId;

    try {
      const response = await fetch("http://localhost:3002/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("La création de la commande a échoué.");

      toast.success("Votre commande a été passée avec succès !");
      localStorage.removeItem("cart");
      updateCartAndStorage([]);
      setName("");
      setPhone("");

      // --- هذا هو الجزء الجديد ---
      setOrderSuccessMessageVisible(true); // إظهار رسالة النجاح
      setShowOrderRestriction(false);      // إخفاء أي تنبيهات أخرى
      window.scrollTo({ top: 0, behavior: 'smooth' }); // الصعود لأعلى الصفحة لرؤية الرسالة

    } catch (error) {
      toast.error(error.message || "Une erreur s'est produite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewComment.trim()) {
      setReviewError("The comment cannot be empty.");
      return;
    }
    setReviewError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("customerName", name);
      formData.append("comment", reviewComment);
      if (reviewImage) formData.append("image", reviewImage);

      const response = await fetch("http://localhost:3002/reviews", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la soumission de l'avis.");
      }
      
      const reviewResponse = await response.json();
      const newReviewId = reviewResponse.review._id;

      toast.success("Merci pour votre commentaire !");
      await submitOrder(newReviewId);
      setShowReviewForm(false);
    } catch (error) {
      toast.error(error.message || "Une erreur s'est produite.");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    let isValid = true;
    const newErrors = { name: null, phone: null };

    if (!name.trim()) {
      newErrors.name = "Name is required .";
      isValid = false;
    } else if (/\d/.test(name)) {
      newErrors.name = "The name must not contain numbers.";
      isValid = false;
    }
    if (!phone.trim()) {
      newErrors.phone = " Phone number is required.";
      isValid = false;
    } else if (!/^\d{8}$/.test(phone.trim())) {
      newErrors.phone = "The number must contain exactly 8 digits.";
      isValid = false;
    }
    setErrors(newErrors);

    if (isValid) {
      if (cartTotal.count < 15 && parseFloat(cartTotal.price) < 7.5) {
        setShowOrderRestriction(true);
        setOrderSuccessMessageVisible(false); // إخفاء رسالة النجاح في حال حاول الطلب مرة أخرى
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setShowOrderRestriction(false);
      setShowReviewPrompt(true);
    }
  };

  const handleReviewPromptResponse = async (wantsToReview) => {
    setShowReviewPrompt(false);
    if (wantsToReview) {
      setShowReviewForm(true);
    } else {
      await submitOrder();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setReviewImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setReviewImage(null);
      setImagePreview('');
    }
  };
  
  const removeImage = () => {
    setReviewImage(null);
    setImagePreview('');
  };

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  return (
    <>
      <Navbar />
      <br /><br /><br /><br />
      <div style={{ paddingTop: "40px" }}>
        <div className="cart-container">
        
          {/* 4. ✨ الجزء الخاص بعرض الرسائل في أعلى الصفحة */}
          {showOrderRestriction && (
            <div className="cart-alert-info">
              <FiInfo className="alert-icon" />
              <p>The order cannot be completed unless there are more than <strong>15 items</strong> in the cart or the total value exceeds <strong>7.5 DT.</strong></p>
            </div>
          )}

          {orderSuccessMessageVisible && (
             <div className="cart-alert-success">
               <FiCheckCircle className="alert-icon" />
               <p>
                 <strong>Order Placed Successfully!</strong> We will contact you shortly by phone to confirm your order.
               </p>
             </div>
          )}

          {cartItems.length === 0 ? (
            <>
              <header className="cart-header">
                <h1>Your cart</h1>
                <span>{cartTotal.count} stickres</span>
                <span className="header-total-price">{cartTotal.price} DT</span>
              </header>
              <main className="cart-grid">
                <div className="cart-card cart-items-list">
                  <div className="cart-empty-container">
                    <FiShoppingCart className="empty-cart-icon" />
                    <h2>Your cart is empty.</h2>
                    <p>It seems that you haven't added anything yet. Explore our products !</p>
                    <Link to="/product" className="empty-cart-button">Start shopping</Link>
                  </div>
                </div>
                <div className="cart-card client-form-container">
                  <h2>Client information</h2>
                  <form className="client-form">
                    <div className="form-group">
                      <label htmlFor="name">Name *</label>
                      <input type="text" id="name" className="form-input" required disabled value={name} readOnly />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone number *</label>
                      <input type="tel" id="phone" className="form-input" required disabled value={phone} readOnly />
                    </div>
                    <div className="discount-section">
                      <div className="form-group">
                        <label htmlFor="promo-code">Discount code</label>
                        <input type="text" id="promo-code" className="form-input" disabled />
                      </div>
                      <button type="submit" className="purchase-btn" disabled>
                        <FiShoppingCart /> Buy
                      </button>
                    </div>
                  </form>
                </div>
              </main>
            </>
          ) : (
            <>
              <div className="cart-header">
                <h1>Your cart</h1>
                <div className="cart-total">
                  <span>{cartTotal.count} stickres</span>
                  <div style={{ borderLeft: "white solid", marginLeft: "15px" }}></div>
                  <span className="header-total-price">{cartTotal.price} DT</span>
                </div>
              </div>
              <main className="cart-grid">
                <div className="cart-card cart-items-list">
                  {cartItems.map((item) => (
                    <React.Fragment key={`${item._id}-${item.size}`}>
                      <div className={`cart-item_panier ${removingItems.has(`${item._id}-${item.size}`) ? "item-removing" : ""}`}>
                        <div className="cart-item_link">
                          <Link to="/ProductDetail" state={{ productData: item }} className="item-image-container">
                            <img src={item.image} alt={item.title} className="item-image" />
                          </Link>
                          <div className="item-details">
                            <p className="item-name">{item.title}</p>
                            <p className="item-size">Size: {item.size || "Standard"}</p>
                          </div>
                          <div className="item-controls">
                            <div className="quantity-control">
                              <button onClick={() => handleQuantityChange(item._id, item.size, -1)}><FiMinus /></button>
                              <input type="text" value={item.quantity} readOnly />
                              <button onClick={() => handleQuantityChange(item._id, item.size, 1)}><FiPlus /></button>
                            </div>
                            <div className="item-price">
                              <span className="current-price">{(parseFloat(item.price) * item.quantity).toFixed(2)} DT</span>
                              <span className="original-price">{(parseFloat(item.originalPrice) * item.quantity).toFixed(2)} DT</span>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveItem(item._id, item.size)} className="remove-btn"><FiTrash2 /></button>
                        </div>
                      </div>
                      <div className="cart-item-phone" key={item._id}>
                        <button onClick={() => handleRemoveItem(item._id, item.size)} className="remove-btn"><FiTrash2 /></button>
                        <div className="cart-item_link">
                          <Link to="/ProductDetail" state={{ productData: item }} className="item-image-container">
                            <img src={item.image} alt={item.title} className="item-image" />
                          </Link>
                          <div className="item-details">
                            <p className="item-name">{item.title}</p>
                            <p className="item-size">Size: {item.size || "Standard"}</p>
                            <div className="quantity-control">
                              <button onClick={() => handleQuantityChange(item._id, item.size, -1)}><FiMinus /></button>
                              <input type="text" value={item.quantity} readOnly />
                              <button onClick={() => handleQuantityChange(item._id, item.size, 1)}><FiPlus /></button>
                            </div>
                          </div>
                          <div className="item-controls">
                            <div className="item-price">
                              <span className="current-price">{(parseFloat(item.price) * item.quantity).toFixed(2)} DT</span>
                              <span className="original-price">{(parseFloat(item.originalPrice) * item.quantity).toFixed(2)} DT</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="cart-item-phone_mini" key={item._id}>
                        <button onClick={() => handleRemoveItem(item._id, item.size)} className="remove-btn"><FiTrash2 /></button>
                        <div className="cart-item_link">
                          <div>
                            <Link to="/ProductDetail" state={{ productData: item }} className="item-image-container">
                              <img src={item.image} alt={item.title} className="item-image" />
                            </Link>
                          </div>
                          <div className="item-details">
                            <p className="item-name">{item.title}</p>
                            <p className="item-size">Size: {item.size || "Standard"}</p>
                          </div>
                          <div className="item-controls"></div>
                        </div>
                        <div className="item-controls_mini">
                          <div className="quantity-control">
                            <button onClick={() => handleQuantityChange(item._id, item.size, -1)}><FiMinus /></button>
                            <input type="text" value={item.quantity} readOnly />
                            <button onClick={() => handleQuantityChange(item._id, item.size, 1)}><FiPlus /></button>
                          </div>
                          <div className="item-price">
                            <span className="current-price">{(parseFloat(item.price) * item.quantity).toFixed(2)} DT</span>
                            <span className="original-price">{(parseFloat(item.originalPrice) * item.quantity).toFixed(2)} DT</span>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <div className="cart-card client-form-container">
                  <h2>Client information</h2>
                  <form className="client-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                      <label htmlFor="name">Name *</label>
                      <input type="text" id="name" className={`form-input ${errors.name ? "input-error" : ""}`} required value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: null }); }} />
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone number *</label>
                      <input type="text" id="phone" className={`form-input ${errors.phone ? "input-error" : ""}`} required value={phone} onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: null }); }} />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>
                    <div className="discount-section">
                      <div className="form-group">
                        <label htmlFor="promo-code">Discount code</label>
                        <input type="text" id="promo-code" className="form-input" />
                      </div>
                      <button type="submit" className="purchase-btn" disabled={isSubmitting}>
                        {isSubmitting ? "En cours..." : (<><FiShoppingCart /> Buy</>)}
                      </button>
                    </div>
                  </form>
                </div>
              </main>
              {showReviewPrompt && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2>Just a moment !</h2>
                    <p>Would you like to share your feedback and receive a guaranteed 5% discount?</p>
                    <div className="modal-actions">
                      <button className="modal-btn confirm" onClick={() => handleReviewPromptResponse(true)}>Yes, sure !</button>
                      <button className="modal-btn decline" onClick={() => handleReviewPromptResponse(false)}>No, thank you</button>
                    </div>
                  </div>
                </div>
              )}
              {showReviewForm && (
                <div className="modal-overlay">
                  <div className="modal-content review-form-container">
                    <h2>Leave your review</h2>
                    <div className="discount-notice">
                      If your comment is approved by the administrator, you will receive a <strong> 5% discount </strong> on your order!
                    </div>
                    <div className="form-group">
                      <label htmlFor="review-name">Name</label>
                      <input type="text" id="review-name" value={name} readOnly disabled />
                    </div>
                    <div className="form-group">
                      <label htmlFor="review-comment">Comment *</label>
                      <textarea id="review-comment" rows="4" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="How was your experience ?" />
                      {reviewError && <span className="error-message">{reviewError}</span>}
                    </div>
                    {/* ... (Image upload form can go here) ... */}
                    <div className="modal-actions">
                      <button className="modal-btn confirm" onClick={handleReviewSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Envoi..." : "Envoyer mon avis"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <br /><br /><br /><br />
    </>
  );
};

export default CartPage;