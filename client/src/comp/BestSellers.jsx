import React from 'react';
import naruto from "../public/pack/pack_naruto.png";
import one from "../public/pack/pack_onepinece.png";
import valo from "../public/pack/valo.png";
import cs from "../public/pack/cs.png";
import vinland from "../public/pack/vinland.png";
import { Link, useNavigate } from "react-router-dom";

const products = [
  { id: 1, title: 'Naruto', imageUrl:naruto,category:"Naruto"},
  { id: 2, title: 'One piece', imageUrl: one ,category:"One Piece"},
  { id: 3, title: 'Valorant', imageUrl:valo,category:"Valorant" },
  { id: 4, title: 'Counter Strike ', imageUrl:cs,category:"Counter Strike" },
  { id: 5, title: 'Jujutsu Kaisen', imageUrl: vinland,category:"Jujutsu Kaisen" },

];

const BentoShowcase = () => {
  // دالة لتحديد الكلاس بناءً على ترتيب العنصر
  const getCardClass = (index) => {
    if (index === 0) return 'card-featured'; // العنصر الأول هو المميز
    if (index === 1 || index === 2) return 'card-standard';
    if (index === 3 || index === 4) return 'card-standard';
    return 'card-standard';
  };
  
  return (
    <section className="bento-section">
      <header className="bento-header">
        <h2 className="bento-title">Top-Rated Laptop Sticker Sets</h2>
        <p className="bento-subtitle">Curated bundles featuring the fan-favorite decals.</p>
      </header>

      <div className="bento-grid">
        {products.map((product, index) => (
          <div className={`bento-card ${getCardClass(index)}`} key={product.id}>
            <div className="bento-card-bg" style={{ backgroundImage: `url(${product.imageUrl})` }}></div>
            <div className="bento-card-content">
              <div className="content-inner">
                <h3 className="bento-card-title">{product.title}</h3>
                <Link  to={`/product?category=${encodeURIComponent(product.category)}`} className="bento-card-button">Explore Stickers</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BentoShowcase;