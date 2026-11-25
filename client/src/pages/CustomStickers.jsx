import React, { useState } from 'react';
import Navbar from '../comp/navbar';
import Footer from '../comp/Footer';
import { FaWhatsapp, FaFacebook } from 'react-icons/fa';
import './CustomStickers.css';

const SubNavbar = ({ isSidebarOpen, toggleSidebar }) => {
    return (
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
    );
};

const CustomStickers = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const galleryItems = [
        {
            id: 1,
            image: "https://i.ibb.co/0VnLcSTx/Bordered-processed-stickers-1766050803922-389939887.png",
            title: "Portrait Stickers",
            desc: "Turn your selfies into amazing stickers.",
            size: "large" // Spans 2x2
        },
        {
            id: 1,
            image: "https://i.ibb.co/rRZkF7N0/2b74192d-6c1e-44b1-b844-72bdbf31213b.png",
            title: "Portrait Stickers",
            desc: "Turn your selfies into amazing stickers.",
            size: "large" // Spans 2x2
        },
        {
            id: 2,
            image: "https://i.ibb.co/23sJk6Pc/4f1e5b2e-8016-4e09-9811-e54fea14a7fc.png",
            title: "Wedding Memories",
            desc: "Perfect gifts for your special day.",
            size: "tall" // Spans 2 rows
        },
        {
            id: 3,
            image: "https://i.ibb.co/MDXBG5kN/6b6be0ee-a936-47ca-aca2-9893788e8526.png",
            title: "Friends & Fun",
            desc: "Capture the best moments with your squad.",
            size: "normal"
        },
        {
            id: 4,
            image: "https://i.ibb.co/XZgZvTzs/9b45d168-760d-4631-8ab1-72e1002ad02a.png",
            title: "Artistic Portraits",
            desc: "Unique styles for unique people.",
            size: "normal"
        },
        {
            id: 5,
            image: "https://i.ibb.co/sdWrCpht/31d8e517-5f82-4f1a-9077-59ef408e0f3f.png",
            title: "Fashion & Style",
            desc: "Express yourself with custom fashion stickers.",
            size: "wide" // Spans 2 columns
        },
        {
            id: 6,
            image: "https://i.ibb.co/nNY2rqgF/555d7838-d437-4234-950f-2af60fe8d1fd.png",
            title: "Professional",
            desc: "Branding stickers for your business.",
            size: "normal"
        },

        {
            id: 7,
            image: "https://i.ibb.co/mr6K1K4N/5480dceb-f9a0-40aa-80af-26e6f50d6f09.png",
            title: "Pet Stickers",
            desc: "Cute stickers for your furry friends.",
            size: "normal"
        },
        {
            id: 8,
            image: "https://i.ibb.co/s90mFKBk/8004cb34-488f-4786-8bc3-276cd19bcdad.png",
            title: "Couples",
            desc: "celebrate your love.",
            size: "tall"
        },
        {
            id: 1,
            image: "https://i.ibb.co/d4qSSKDh/414448ab-63f1-49e3-a6b1-876c738414ca.png",
            title: "Portrait Stickers",
            desc: "Turn your selfies into amazing stickers.",
            size: "large" // Spans 2x2
        },
        {
            id: 2,
            image: "https://i.ibb.co/JFB8kRkR/577953de-7c02-48dd-95ad-1037df257568.png",
            title: "Wedding Memories",
            desc: "Perfect gifts for your special day.",
            size: "tall" // Spans 2 rows
        },

        {
            id: 3,
            image: "https://i.ibb.co/VcWX3GPP/a26ca34b-be25-4f0e-8a96-b57ac573afef.png",
            title: "Friends & Fun",
            desc: "Capture the best moments with your squad.",
            size: "normal"
        },
        {


            id: 4,
            image: "https://i.ibb.co/vCHrtr0b/ad5c72cb-c599-47de-82f3-ba2052aa1c8c.png",
            title: "Artistic Portraits",
            desc: "Unique styles for unique people.",
            size: "normal"
        },
        {
            id: 5,
            image: "https://i.ibb.co/qFVZBM1c/b946db4f-705c-4629-82fc-d963241dda41.png",
            title: "Fashion & Style",
            desc: "Express yourself with custom fashion stickers.",
            size: "wide" // Spans 2 columns
        },
        {
            id: 6,
            image: "https://i.ibb.co/rGSF2PT3/d9d2f3ef-11e5-4001-a1bc-641cfa114c6c.png",
            title: "Professional",
            desc: "Branding stickers for your business.",
            size: "normal"
        },
        {
            id: 1,
            image: "https://i.ibb.co/rRZkF7N0/2b74192d-6c1e-44b1-b844-72bdbf31213b.png",
            title: "Portrait Stickers",
            desc: "Turn your selfies into amazing stickers.",
            size: "large" // Spans 2x2
        },
        {
            id: 2,
            image: "https://i.ibb.co/23sJk6Pc/4f1e5b2e-8016-4e09-9811-e54fea14a7fc.png",
            title: "Wedding Memories",
            desc: "Perfect gifts for your special day.",
            size: "tall" // Spans 2 rows
        },
        {
            id: 3,
            image: "https://i.ibb.co/MDXBG5kN/6b6be0ee-a936-47ca-aca2-9893788e8526.png",
            title: "Friends & Fun",
            desc: "Capture the best moments with your squad.",
            size: "normal"
        },
        {
            id: 4,
            image: "https://i.ibb.co/XZgZvTzs/9b45d168-760d-4631-8ab1-72e1002ad02a.png",
            title: "Artistic Portraits",
            desc: "Unique styles for unique people.",
            size: "normal"
        },
        {
            id: 5,
            image: "https://i.ibb.co/sdWrCpht/31d8e517-5f82-4f1a-9077-59ef408e0f3f.png",
            title: "Fashion & Style",
            desc: "Express yourself with custom fashion stickers.",
            size: "wide" // Spans 2 columns
        },
        {
            id: 6,
            image: "https://i.ibb.co/nNY2rqgF/555d7838-d437-4234-950f-2af60fe8d1fd.png",
            title: "Professional",
            desc: "Branding stickers for your business.",
            size: "normal"
        },
        {
            id: 7,
            image: "https://i.ibb.co/mr6K1K4N/5480dceb-f9a0-40aa-80af-26e6f50d6f09.png",
            title: "Pet Stickers",
            desc: "Cute stickers for your furry friends.",
            size: "normal"
        },
        {
            id: 8,
            image: "https://i.ibb.co/s90mFKBk/8004cb34-488f-4786-8bc3-276cd19bcdad.png",
            title: "Couples",
            desc: "celebrate your love.",
            size: "tall"
        },
        {
            id: 1,
            image: "https://i.ibb.co/d4qSSKDh/414448ab-63f1-49e3-a6b1-876c738414ca.png",
            title: "Portrait Stickers",
            desc: "Turn your selfies into amazing stickers.",
            size: "large" // Spans 2x2
        },
        {
            id: 2,
            image: "https://i.ibb.co/JFB8kRkR/577953de-7c02-48dd-95ad-1037df257568.png",
            title: "Wedding Memories",
            desc: "Perfect gifts for your special day.",
            size: "tall" // Spans 2 rows
        },
        {
            id: 3,
            image: "https://i.ibb.co/zh2p2y8z/a26ca34b-be25-4f0e-8a96-b57ac573afef.png",
            title: "Friends & Fun",
            desc: "Capture the best moments with your squad.",
            size: "normal"
        },
        {
            id: 4,
            image: "https://i.ibb.co/jvxHtxTb/ad5c72cb-c599-47de-82f3-ba2052aa1c8c.png",
            title: "Artistic Portraits",
            desc: "Unique styles for unique people.",
            size: "normal"
        },
        {
            id: 5,
            image: "https://i.ibb.co/qFVZBM1c/b946db4f-705c-4629-82fc-d963241dda41.png",
            title: "Fashion & Style",
            desc: "Express yourself with custom fashion stickers.",
            size: "wide" // Spans 2 columns
        },
        {
            id: 6,
            image: "https://i.ibb.co/rGSF2PT3/d9d2f3ef-11e5-4001-a1bc-641cfa114c6c.png",
            title: "Professional",
            desc: "Branding stickers for your business.",
            size: "normal"
        },
        {
            id: 1,
            image: "https://i.ibb.co/rRZkF7N0/2b74192d-6c1e-44b1-b844-72bdbf31213b.png",
            title: "Portrait Stickers",
            desc: "Turn your selfies into amazing stickers.",
            size: "large" // Spans 2x2
        },
        {
            id: 2,
            image: "https://i.ibb.co/23sJk6Pc/4f1e5b2e-8016-4e09-9811-e54fea14a7fc.png",
            title: "Wedding Memories",
            desc: "Perfect gifts for your special day.",
            size: "tall" // Spans 2 rows
        },
        {
            id: 3,
            image: "https://i.ibb.co/MDXBG5kN/6b6be0ee-a936-47ca-aca2-9893788e8526.png",
            title: "Friends & Fun",
            desc: "Capture the best moments with your squad.",
            size: "normal"
        },
        {
            id: 4,
            image: "https://i.ibb.co/XZgZvTzs/9b45d168-760d-4631-8ab1-72e1002ad02a.png",
            title: "Artistic Portraits",
            desc: "Unique styles for unique people.",
            size: "normal"
        },
        {
            id: 5,
            image: "https://i.ibb.co/sdWrCpht/31d8e517-5f82-4f1a-9077-59ef408e0f3f.png",
            title: "Fashion & Style",
            desc: "Express yourself with custom fashion stickers.",
            size: "wide" // Spans 2 columns
        },
        {
            id: 6,
            image: "https://i.ibb.co/nNY2rqgF/555d7838-d437-4234-950f-2af60fe8d1fd.png",
            title: "Professional",
            desc: "Branding stickers for your business.",
            size: "normal"
        },

        {
            id: 8,
            image: "https://i.ibb.co/s90mFKBk/8004cb34-488f-4786-8bc3-276cd19bcdad.png",
            title: "Couples",
            desc: "celebrate your love.",
            size: "tall"
        },
        {
            id: 1,
            image: "https://i.ibb.co/d4qSSKDh/414448ab-63f1-49e3-a6b1-876c738414ca.png",
            title: "Portrait Stickers",
            desc: "Turn your selfies into amazing stickers.",
            size: "large" // Spans 2x2
        },
        {
            id: 2,
            image: "https://i.ibb.co/JFB8kRkR/577953de-7c02-48dd-95ad-1037df257568.png",
            title: "Wedding Memories",
            desc: "Perfect gifts for your special day.",
            size: "tall" // Spans 2 rows
        },

        {
            id: 5,
            image: "https://i.ibb.co/qFVZBM1c/b946db4f-705c-4629-82fc-d963241dda41.png",
            title: "Fashion & Style",
            desc: "Express yourself with custom fashion stickers.",
            size: "wide" // Spans 2 columns
        },
        {
            id: 6,
            image: "https://i.ibb.co/rGSF2PT3/d9d2f3ef-11e5-4001-a1bc-641cfa114c6c.png",
            title: "Professional",
            desc: "Branding stickers for your business.",
            size: "normal"
        },

    ];

    return (
        <div className="custom-stickers-page">
            <SubNavbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <header className="cs-hero">
                <h1 className="cs-title">Your Photo, Your Sticker</h1>
                <p className="cs-subtitle">
                    Want a unique sticker of yourself, your friends, or your loved ones? <br />
                    <span>We make it happen.</span> Contact us to order your custom personalized stickers today.
                </p>
            </header>

            <section className="cs-gallery-section">
                <h2 className="cs-section-title">Inspiration Gallery</h2>
                {/* Carousel Container */}
                <div className="carousel-wrapper">
                    <div className="carousel-track">
                        {/* Original Items */}
                        {galleryItems.map((item) => (
                            <div className="cs-card carousel-ite" key={`orig-${item.id}`}>
                                <img src={item.image} alt={item.title} loading="lazy" />

                            </div>
                        ))}


                    </div>
                </div>
            </section>

            <section className="">
                <div className="cs-contact-container">
                    <h2 className="cs-contact-title">Ready to Order?</h2>
                    <p className="cs-contact-text">
                        Send us your photos and requirements. We'll handle the rest!
                        <br />Click below to chat with our admin.
                    </p>

                    <div className="cs-buttons">
                        <a href="https://wa.me/21600000000" target="_blank" rel="noopener noreferrer" className="cs-btn whatsapp">
                            <FaWhatsapp className="cs-icon" />
                            WhatsApp
                        </a>
                        <a href="https://facebook.com/yourpage" target="_blank" rel="noopener noreferrer" className="cs-btn facebook">
                            <FaFacebook className="cs-icon" />
                            Facebook
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default CustomStickers;
