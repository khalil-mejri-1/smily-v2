import React, { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { categoryData } from "./../choix/choix.jsx";
import {
  FaBars,
  FaSearch,
  FaShoppingCart,
  FaTimes,
  FaArrowLeft,
  FaTrashAlt,
} from "react-icons/fa";
import logo from "../public/logo.png";
import logo2 from "../public/logo2.png";

// ===================================================================
// --- المكونات الأصلية (بدون تغيير) ---
// ===================================================================

const ShoppingCart = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState([]);
  const [removingItems, setRemovingItems] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      const items = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(items);
    }
  }, [isOpen]);

  const updateCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
  };

  const handleQuantityChange = (productId, productSize, amount) => {
    const newCart = cartItems.map((item) => {
      if (item._id === productId && item.size === productSize) {
        const newQuantity = item.quantity + amount;
        return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
      }
      return item;
    });
    updateCart(newCart);
  };

  const handleRemoveItem = (productId, productSize) => {
    const itemKey = `${productId}-${productSize}`;
    const animationDuration = 500;
    setRemovingItems((prev) => new Set(prev).add(itemKey));
    toast.error("Item removed from cart");
    setTimeout(() => {
      const newCart = cartItems.filter(
        (item) => !(item._id === productId && item.size === productSize)
      );
      updateCart(newCart);
    }, animationDuration);
  };

  const subtotal = useMemo(() => {
    return cartItems
      .reduce((total, item) => {
        const price = parseFloat(item.price || item.currentPrice) || 0;
        return total + price * item.quantity;
      }, 0)
      .toFixed(2);
  }, [cartItems]);

  return (
    <>
      <div
        className={`sidebar-overlay_panier ${isOpen ? "show" : ""}`}
        onClick={onClose}
      ></div>
      <aside className={`cart-sidebar_panier ${isOpen ? "open" : ""}`}>
        <div className="cart-header_panier">
          <h3>Shopping Cart</h3>
          <button onClick={onClose} className="header-btn">
            <FaTimes />
          </button>
        </div>
        {cartItems.length > 0 ? (
          <>
            <div className="cart-meta">
              <span className="product-count-tag">
                {cartItems.length} product(s)
              </span>
            </div>
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <Link
                  to="/ProductDetail"
                  state={{ productData: item }}
                  className={`cart-item ${
                    removingItems.has(`${item._id}-${item.size}`)
                      ? "item-removing-sidebar"
                      : ""
                  }`}
                  key={`${item._id}-${item.size}`}
                  onClick={onClose}
                >
                  <img
                    src={item.image}
                    alt={item.name || item.title}
                    className="cart-item-image"
                  />
                  <div className="cart-item-details">
                    <span className="cart-item-title">
                      {item.name || item.title}
                    </span>
                    <span style={{ color: "white", fontSize: "15px" }}>
                      size: {item.size}
                    </span>
                    <div className="quantity-selector">
                      <button
                        className="quantity-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleQuantityChange(item._id, item.size, -1);
                        }}
                      >
                        {" "}
                        -{" "}
                      </button>
                      <span className="cart-item-quantity">
                        {item.quantity}
                      </span>
                      <button
                        className="quantity-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleQuantityChange(item._id, item.size, 1);
                        }}
                      >
                        {" "}
                        +{" "}
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="cart-item-price">
                      <span className="current-price_panier">
                        {(parseFloat(item.price) * item.quantity).toFixed(2)} DT
                      </span>
                      <span className="original-price">
                        {(
                          parseFloat(item.originalPrice) * item.quantity
                        ).toFixed(2)}{" "}
                        DT
                      </span>
                    </div>
                    <button
                      className="cart-item-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemoveItem(item._id, item.size);
                      }}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
            <div className="cart-footer">
              <div className="subtotal">
                <span>Subtotal</span>
                <div>
                  <span
                    style={{
                      color: "#f7d900",
                      textShadow: " 0 0 8px rgba(247, 217, 0, 0.3)",
                      fontWeight: "700",
                      fontSize: "20px",
                    }}
                  >
                    {subtotal} DT
                  </span>
                  <br />
                  <span
                    style={{
                      color: " #718096",
                      fontWeight: "500",
                      fontSize: "18px",
                      textDecoration: "line-through",
                      marginLeft: "7px",
                    }}
                  >
                    {(subtotal * 2).toFixed(2)} DT
                  </span>
                </div>
              </div>
              <Link to="/checkout" onClick={onClose}>
                <button className="checkout-btn">Go to checkout</button>
              </Link>
            </div>
          </>
        ) : (
          <div
            className="cart-empty"
            style={{ position: "relative", textAlign: "center" }}
          >
            <p>Your shopping cart is empty.</p> <br />
            <Link to="/product" className="empty-cart-button" onClick={onClose}>
              {" "}
              Continue Shopping{" "}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const [activeSubcategories, setActiveSubcategories] = useState(null);
  const [subCategoryTitle, setSubCategoryTitle] = useState("");

  const handleCategoryClick = (category) => {
    if (category.subCategories && category.subCategories.length > 0) {
      setActiveSubcategories(category.subCategories);
      setSubCategoryTitle(category.name);
    } else {
      window.location.href = `/product?category=${encodeURIComponent(
        category.name
      )}`;
      onClose();
    }
  };

  const handleBackClick = () => setActiveSubcategories(null);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setActiveSubcategories(null);
        setSubCategoryTitle("");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      ></div>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div
          className={`sidebar-panel ${
            !activeSubcategories ? "panel-active" : "panel-hidden-left"
          }`}
        >
          <div className="sidebar-header">
            <h3>Categories</h3>
            <button onClick={onClose} className="header-btn">
              <FaTimes />
            </button>
          </div>
          <ul className="category-list">
            {categoryData.map((category) => (
              <li key={category.name}>
                <a onClick={() => handleCategoryClick(category)}>
                  <span>
                    {" "}
                    <img src={category.icon} className="category-icon" />
                  </span>{" "}
                  {category.name}
                  {category.subCategories &&
                    category.subCategories.length > 0 && (
                      <span className="arrow">{">"}</span>
                    )}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div
          className={`sidebar-panel ${
            activeSubcategories ? "panel-active" : "panel-hidden-right"
          }`}
        >
          <div className="sidebar-header">
            <button onClick={handleBackClick} className="header-btn">
              <FaArrowLeft />
            </button>
            <h3>{subCategoryTitle}</h3>
          </div>
          <ul className="category-list">
            {activeSubcategories && (
              <li key="all-subcategories">
                <Link
                  to={`/product?mainCategory=${encodeURIComponent(
                    subCategoryTitle
                  )}&subcats=${activeSubcategories
                    .map(encodeURIComponent)
                    .join(",")}`}
                  onClick={onClose}
                >
                  All {subCategoryTitle} <span className="arrow">{">"}</span>
                </Link>
              </li>
            )}
            {activeSubcategories &&
              activeSubcategories.map((subcategory) => (
                <li key={subcategory}>
                  <Link
                    to={`/product?category=${encodeURIComponent(subcategory)}`}
                    onClick={onClose}
                  >
                    {subcategory} <span className="arrow">{">"}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

// ===================================================================
// --- ✨ مكون واجهة البحث (تم إصلاحه) ---
// ===================================================================

const SearchUI = ({
  query,
  setQuery,
  isSearchLoading,
  isDropdownVisible,
  setDropdownVisible,
  results,
  hasResults,
  handleSearchSubmit,
  handleLinkClick,
  navigate,
}) => {
  const handleSafeNavigate = (e, path, state = {}) => {
    e.preventDefault();
    handleLinkClick();
    navigate(path, { state });
  };

  return (
    <div className="search-bar-content">
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <div style={{marginLeft:"35px"}}></div>
        <input
          type="text"
          className="search-input_client"
          placeholder="Search for stickers or categories..."
          value={query}
          onKeyDown={handleSearchSubmit}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query) setDropdownVisible(true);
          }}
          autoFocus
        />
      </div>
      {isDropdownVisible && query && (
        <div className="search-suggestions">
          {isSearchLoading ? (
            <div className="loading-text">Searching...</div>
          ) : hasResults ? (
            <ul>
              {results.categories.length > 0 && (
                <>
                  <li className="suggestion-header">Related Categories</li>
                  {results.categories.map((cat) => (
                    <li key={cat}>
                      <Link
                        to={`/product?category=${cat}`}
                        onClick={(e) =>
                          handleSafeNavigate(e, `/product?category=${cat}`)
                        }
                        // ✅ --- FIX: Stop the mousedown event to prevent race condition
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <span className="suggestion-category">{cat}</span>
                      </Link>
                    </li>
                  ))}
                </>
              )}
              {results.products.map((item) => (
                <li key={item._id}>
                  <Link
                    to="/ProductDetail"
                    state={{ productData: item }}
                    onClick={(e) =>
                      handleSafeNavigate(e, "/ProductDetail", {
                        productData: item,
                      })
                    }
                    // ✅ --- FIX: Stop the mousedown event to prevent race condition
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="suggestion-image"
                    />
                    <span className="suggestion-title">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-results">
              <p>No results found for "{query}"</p>
            </div>
          )}
          {hasResults && !isSearchLoading && (
            <div className="show-more-container">
              <Link
                to={`/product?recherche=${query}`}
                className="show-more-link"
                onClick={(e) =>
                  handleSafeNavigate(e, `/product?recherche=${query}`)
                }
                // ✅ --- FIX: Stop the mousedown event to prevent race condition
                onMouseDown={(e) => e.stopPropagation()}
              >
                View All Results for "{query}"
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// --- مكون نافذة البحث للهاتف (بدون تغيير) ---
// ===================================================================

const MobileSearchModal = ({ isOpen, onClose, searchProps }) => {
  if (!isOpen) return null;
  return (
    <div className="mobile-search-modal-overlay">
      <div className="mobile-search-modal-content">
        <div className="mobile-search-header">
          <h3 className="titre_smily">Search</h3>
          <button onClick={onClose} className="close-button">
            <FaTimes />
          </button>
        </div>
        <div className="mobile-search-body">
          <div style={{ paddingRight: "35px" }}>
            <SearchUI {...searchProps} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// --- المكون الرئيسي (Navbar) ---
// ===================================================================

const Navbar = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [isSearchLoading, setSearchLoading] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [results, setResults] = useState({
    categories: [],
    products: [],
  });
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);


useEffect(() => {
  if (query.trim() === "") {
    setResults({ categories: [], products: [] });
    setDropdownVisible(false);
    setSearchLoading(false);
    return;
  }
  
  setDropdownVisible(true);
  setSearchLoading(true);

  const delayDebounceFn = setTimeout(async () => {
    try {
      const response = await axios.get(
        `http://localhost:3002/search/products?q=${query}`
      );

      // الـ Backend الآن يرسل { items: [...] }
      const products = response.data.items || [];
      
      // استخلاص الفئات الفريدة من المنتجات
      const uniqueCategories = [
        ...new Set(
          products
            .map(item => item.category) 
            .filter(category => category && category.trim() !== '') 
        )
      ];

      // تحديث حالة النتائج: تخزين الفئات والمنتجات بشكل منفصل
      setResults({ 
        categories: uniqueCategories, 
        products: products 
      });

    } catch (error) {
      console.error("Failed to fetch search suggestions:", error);
      setResults({ categories: [], products: [] });
    } finally {
      setSearchLoading(false);
    }
  }, 300);

  return () => clearTimeout(delayDebounceFn);
}, [query]);

  // Hook لإغلاق نافذة النتائج عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setDropdownVisible(false);
      }
    };
    // استخدام mousedown لأنه يحدث قبل click
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const hasResults = results.categories?.length > 0 || results.products?.length > 0;


  const handleLinkClick = () => {
    setQuery("");
    setDropdownVisible(false);
    setMobileSearchOpen(false);
  };

  const handleSearchSubmit = (event) => {
    if (event.key === "Enter" && query.trim() !== "") {
      const searchUrl = `/product?recherche=${query}`;
      handleLinkClick();
      navigate(searchUrl);
    }
  };

  const searchProps = {
    query,
    setQuery,
    isSearchLoading,
    isDropdownVisible,
    setDropdownVisible,
    results,
    hasResults,
    handleSearchSubmit,
    handleLinkClick,
    navigate,
  };

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ShoppingCart isOpen={isCartOpen} onClose={() => setCartOpen(false)} />
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        searchProps={searchProps}
      />

      <header className="mobile-header">
        <Link to="/" className="logo">
          <img src={logo} alt="Smily Logo" className="logo-icon_mobil" />
          <span className="titre_smily">Smily</span>
        </Link>
      </header>

      <nav className="navbar">
        <div className="navbar_mini">
          <div className="navbar-left">
            <button
              className="nav-button shop-button"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars /> <span className="button_shop">Shop</span>
            </button>
            <Link to="/" className="logo desktop-logo">
              <img src={logo} alt="Smily Logo" className="logo-icon" />
              <span className="titre_smily">Smily</span>
            </Link>
          </div>

          <div className="navbar-center" ref={searchContainerRef}>
            <div className="bloc_search-bar">
              <SearchUI {...searchProps} />
            </div>
          </div>

          <div className="navbar-right">
            <button
              className="nav-button cart-button"
              onClick={() => setCartOpen(true)}
            >
              <FaShoppingCart />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      <footer className="mobile-bottom-nav">
        <button
          className="mobile-nav-button"
          onClick={() => setSidebarOpen(true)}
        >
          <FaBars /> <span>Shop</span>
        </button>
        <button
          className="mobile-nav-button"
          onClick={() => setMobileSearchOpen(true)}
        >
          <FaSearch /> <span>Search</span>
        </button>
        <button className="mobile-nav-button" onClick={() => setCartOpen(true)}>
          <FaShoppingCart />
          {cartCount > 0 && (
            <span className="cart-count-mobile">{cartCount}</span>
          )}
          <span>Cart</span>
        </button>
      </footer>
    </>
  );
};

export default Navbar;
