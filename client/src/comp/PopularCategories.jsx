import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiSearch, FiGrid } from 'react-icons/fi';
import { categoryData } from '../choix/choix';
import './PopularCategories.css';

const PopularCategories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);

  // Filter categories based on search
  // We filter top-level categories. 
  // Future enhancement: Search inside subCategories too.
  const filteredCategories = categoryData.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.subCategories && cat.subCategories.some(sub => sub.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const displayedCategories = filteredCategories.slice(0, visibleCount);

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  return (
    <section className="pop-categories-section">
      <div className="pop-header">
        <h2 className="pop-title">Find Your Vibe</h2>
        <p className="pop-subtitle">Browse through thousands of stickers by category</p>

        {/* Creative Search Bar */}
        <div className="pop-search-wrapper">
          <div className="pop-search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search specific categories (e.g. Anime, Cat, Gym)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pop-grid">
        {displayedCategories.map((category, index) => (
          <Link
            to={`/product?category=${encodeURIComponent(category.name)}`}
            className="pop-card"
            key={index}
          >
            <div className="pop-card-image">
              {/* Use the imported icon/image from categoryData */}
              <img src={category.icon} alt={category.name} loading="lazy" />
              <div className="pop-overlay"></div>
              <div className="pop-icon-badge">
                <FiGrid />
              </div>
            </div>

            <div className="pop-card-content">
              <h3>{category.name}</h3>
              <div className="pop-meta">
                <span>{category.subCategories ? `${category.subCategories.length}+ Topics` : 'Collection'}</span>
                <span className="pop-arrow"><FiArrowRight /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {visibleCount < filteredCategories.length && (
        <div className="pop-actions">
          <button onClick={handleShowMore} className="pop-show-more-btn">
            Show More Categories
          </button>
        </div>
      )}

      {filteredCategories.length === 0 && (
        <div className="no-results-cat">
          <p>No categories found for "{searchTerm}"</p>
        </div>
      )}
    </section>
  );
};

export default PopularCategories;
