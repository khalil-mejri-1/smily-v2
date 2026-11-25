import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import './FeaturedCollections.css';
import Ved from './vedio';

const collections = [
    {
        id: 1,
        type: 'video',
        className: "item-large"
    },
    {
        id: 2,
        title: "Custom Stickers",
        subtitle: "Create your own unique style",
        badge: "New",
        imageUrl: "https://res.cloudinary.com/dbtcocjdk/image/fetch/f_auto,dpr_auto,w_1600/https://storage.jukeboxprint.com/images/9378736-custom-super-matte-stickers.jpg",
        link: "/custom-stickers",
        className: "item-wide"
    },
    {
        id: 3,
        title: "Tunisian Vibes",
        subtitle: "Choufli Hal & Cultural icons",
        badge: "Local",
        imageUrl: "https://i.ytimg.com/vi/aL3t-JmoDPE/maxresdefault.jpg",
        link: "/product?category=Movies%20%26%20TV%20Shows",
        className: "item-square-1"
    },
    {
        id: 4,
        title: "Special Moments",
        subtitle: "Graduation, Weddings & more",
        badge: "Events",
        imageUrl: "https://d1fw31bt5svviq.cloudfront.net/img/photo_magnets_product_d.jpg.jpg",
        link: "/product?category=Graduation",
        className: "item-wide-sm"
    }
];

const FeaturedCollections = () => {
    return (
        <section className="featured-collections-section">
            <div className="bento-grid">
                {collections.map((item) => (
                    item.type === 'video' ? (
                        <div key={item.id} className={`bento-card ${item.className} video-card`}>
                            <Ved />
                        </div>
                    ) : (
                        <Link to={item.link} key={item.id} className={`bento-card ${item.className}`}>
                            <img src={item.imageUrl} alt={item.title} className="bento-card-bg" />
                            <div className="bento-overlay"></div>

                            <div className="bento-content">
                                <span className="bento-badge">{item.badge}</span>
                                <h3 className="bento-title">{item.title}</h3>
                                <p className="bento-desc">{item.subtitle}</p>
                            </div>

                            <div className="btn-arrow">
                                <FiArrowRight />
                            </div>
                        </Link>
                    )
                ))}
            </div>
        </section>
    );
};

export default FeaturedCollections;
