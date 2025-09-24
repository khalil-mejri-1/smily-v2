import React from 'react';
import naruto from "../public/pack/pack_naruto.png";
import one from "../public/pack/pack_onepinece.png";
import valo from "../public/pack/valo.png";
import cs from "../public/pack/cs.png";
import vinland from "../public/pack/vinland.png";

const products = [
  { id: 1, title: 'Naruto Sticker Pack', imageUrl:naruto, featured: true },
  { id: 2, title: 'One piece Sticker Pack', imageUrl: one },
  { id: 3, title: 'Valorant Pack', imageUrl:valo },
  { id: 4, title: 'Cs go Pack', imageUrl:cs },
  { id: 5, title: 'Jujutsu Kaisen Pack', imageUrl: vinland },

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
        <h2 className="bento-title">Our Best Seller Packs</h2>
        <p className="bento-subtitle">An exclusive collection of our most loved sticker packs.</p>
      </header>

      <div className="bento-grid">
        {products.map((product, index) => (
          <div className={`bento-card ${getCardClass(index)}`} key={product.id}>
            <div className="bento-card-bg" style={{ backgroundImage: `url(${product.imageUrl})` }}></div>
            <div className="bento-card-content">
              <div className="content-inner">
                <h3 className="bento-card-title">{product.title}</h3>
                <button className="bento-card-button">Explore Pack</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BentoShowcase;