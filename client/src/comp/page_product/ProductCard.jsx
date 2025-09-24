import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaCheckCircle } from 'react-icons/fa';

const ProductCard = ({ product, cartItemIds, justAddedIds, onAddToCart }) => {

  const handleCardAddToCart = (event, productToAdd) => {
    event.stopPropagation(); // Prevent navigation when clicking the button
    onAddToCart(productToAdd);
  };

  const isInCart = cartItemIds.has(product._id);
  const wasJustAdded = justAddedIds.includes(product._id);

  return (
    <Link
      to="/ProductDetail"
      state={{ productData: product }}
      className="pro-sticker-card"
      // Prevent re-rendering the entire list when one item is added
      onClick={(e) => { if (e.target.closest('button')) e.preventDefault(); }}
    >
        ببببب
      <div className="badge_sold">Up To 50%</div>
      <div className="card-glow"></div>
      <div className="pro-image-container">
        <img src={product.image} alt={product.name} className="pro-sticker-image" />
      </div>
      <div className="card-body">
        <p className="titre_card">{product.name}</p>
        <div className="price-and-cart">
          <div className="pro-pricing">
            <span className="pro-current-price">{product.price}</span>
            <span className="pro-original-price">{product.originalPrice}</span>
          </div>
          <button
            className="pro-add-to-cart-btn_product"
            onClick={(e) => handleCardAddToCart(e, product)}
            disabled={isInCart || wasJustAdded}
          >
            {isInCart || wasJustAdded ? <FaCheckCircle /> : <FaShoppingCart />}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
