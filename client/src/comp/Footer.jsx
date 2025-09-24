import React from 'react';
// استيراد الأيقونات من مكتبات مختلفة
import { FaHome, FaShoppingCart, FaFacebook, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* العمود الأول: روابط سريعة */}
        <div className="footer-column">
          <h3 className="footer-title">Liens rapide</h3>
          <ul className="footer-list">
            <li>
              <a href="#">
                <FaHome className="footer-icon" /> Home
              </a>
            </li>
            <li>
              <a href="#">
                <FaShoppingCart className="footer-icon" /> Checkout
              </a>
            </li>
          </ul>
        </div>

        {/* العمود الثاني: المنتجات */}
        <div className="footer-column">
          <h3 className="footer-title">Produit</h3>
          <ul className="footer-list">
            <li>
              <a href="#">
                <span className="footer-icon emoji-icon">😃</span> Stickers
              </a>
            </li>
            <li>
              <a href="#">
                <span className="footer-icon emoji-icon">📦</span> Packs stickers
              </a>
            </li>
          </ul>
        </div>

        {/* العمود الثالث: الشبكات الاجتماعية */}
        <div className="footer-column">
          <h3 className="footer-title">Réseaux sociaux</h3>
          <ul className="footer-list">
            <li>
              <a href="#">
                <FaFacebook className="footer-icon facebook-icon" /> Facebook
              </a>
            </li>
            <li>
              <a href="#">
                <FaInstagram className="footer-icon instagram-icon" /> Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;