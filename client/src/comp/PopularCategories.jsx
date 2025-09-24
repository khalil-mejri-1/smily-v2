import React from 'react';

import { Link } from 'react-router-dom';
const categories = [
  { id: 1, name: 'Attack on Titan', imageUrl: "https://images5.alphacoders.com/120/thumb-1920-1206340.jpg"},
  { id: 2, name: 'Berserk', imageUrl: "https://images2.alphacoders.com/135/thumb-1920-1355138.png" },
  { id: 3, name: 'Naruto', imageUrl: "https://images3.alphacoders.com/132/thumb-1920-1328396.png" },
  { id: 4, name: 'Valorant', imageUrl:"https://images7.alphacoders.com/132/thumb-1920-1321613.jpeg"  },
  { id: 5, name: 'One Piece', imageUrl:"https://images6.alphacoders.com/135/thumb-1920-1352218.png"  },
];

const ExpandingCategories = () => {
  return (
    <section className="expanding-section">
      <header className="expanding-header">
        <h2>Popular Categories Stickers</h2>
        <p>Browse our most Categories stickers</p>
      </header>

      <div className="cards-container">
        {categories.map((category) => (
          <Link  className="expanding-card"        style={{ backgroundImage: `url(${category.imageUrl})` }}      key={category.id}  to={`/product?category=${encodeURIComponent(category.name)}`}>

            <div className="card-label">
              <h3>{category.name}</h3>
            </div>
   
          
          </Link>
          
        ))}
      </div>
    </section>
  );
};

export default ExpandingCategories;