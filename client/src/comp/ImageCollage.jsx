import React from "react";
import Ved from "./vedio.jsx";
const images = [
  {
    id: 1,
    src: "https://smily-320bb.web.app/assets/imgremize-DDa5ZRd7.png",
    title: "عروض خاصة",
  },
  {
    id: 2,
    src: "https://res.cloudinary.com/dbtcocjdk/image/fetch/f_auto,dpr_auto,w_1600/https://storage.jukeboxprint.com/images/9378736-custom-super-matte-stickers.jpg",
    title: "تزيين الأكواب",
  },
  {
    id: 3,
    src: "https://d1fw31bt5svviq.cloudfront.net/img/photo_magnets_product_d.jpg.jpg",
    title: "ملصقات لابتوب",
  },
  {
    id: 4,
    src: "https://res.cloudinary.com/dbtcocjdk/image/fetch/f_auto,dpr_auto,w_auto/https://storage.jukeboxprint.com/s/images/die-cut-hero-A2025.jpg",
    title: "مغناطيس ثلاجة",
  },
];

const EnhancedCollage = () => {
  return (
    <div className="enhanced-collage-wrapper">
      <div className="enhanced-collage-container">
        {/* الصورة الأولى والثانية كما هما */}
        <div className="collage-item item-1" key={images[0].id}>
        
          <Ved/>
        
        </div>
        <div className="collage-item item-2" key={images[1].id}>
          <img
            src={images[1].src}
            alt={images[1].title}
            className="collage-image"
          />
          <div className="image-overlay">
            {/* <h3 className="overlay-text">{images[1].title}</h3> */}
          </div>
        </div>

        {/* الحاوية الجديدة التي تسببت في المشكلة، وسنحلها بالـ CSS */}
        <div className="two-columns-mobile-container">
          <div className="collage-item item-3" key={images[2].id}>
            <img
              src={images[2].src}
              alt={images[2].title}
              className="collage-image"
            />
            <div className="image-overlay">
              {/* <h3 className="overlay-text">{images[2].title}</h3> */}
            </div>
          </div>
          <div className="collage-item item-4" key={images[3].id}>
            <img
              src={images[3].src}
              alt={images[3].title}
              className="collage-image"
            />
            <div className="image-overlay">
              {/* <h3 className="overlay-text">{images[3].title}</h3> */}
            </div>
          </div>
        </div>

        {/* الصورة الخامسة */}
      </div>
    </div>
  );
};

export default EnhancedCollage;
