import React from 'react';
import sosial from '../public/logo/3430534.png'
import msg from '../public/logo/3841975.png'
import medical from '../public/logo/564276.png'
import animal from '../public/logo/5930063.png'
import pc from '../public/logo/6803322.png'
import sport from '../public/logo/7438654.png'
import mems from '../public/logo/8073599.png'
import film from '../public/logo/906352.png'
import Aesthetic from '../public/logo/Aesthetic-Artwork-PNG-Picture.png'
import anime from '../public/logo/Screenshot 2025-09-24 140638_pixian_ai - Copy.png'
import musik from '../public/logo/png-clipart-computer-icons-apple-music-apple-text-rectangle-thumbnail_pixian_ai.png'
import gaming from '../public/logo/st,small,507x507-pad,600x600,f8f8f8 (4)_pixian_ai (5).png'
import all from '../public/logo/Screenshot 2025-09-24 144245_pixian_ai.png'
// قائمة الفئات التي سيتم عرضها
const categories = [
  { icon:sosial , name: 'Anime & Cartoons' },
  { icon: msg, name: 'Gaming' },
  { icon:medical , name: 'Movies & TV Shows' },
  { icon: animal, name: 'Music' },
  { icon: pc, name: 'Memes & Funny' },
  { icon: sport, name: 'Quotes & Aesthetic' },
  { icon: mems, name: 'Art & Aesthetic' },
  { icon: film, name: 'Technology & Work' },
  { icon:Aesthetic , name: 'Medical & Healthcare' },
  { icon:anime , name: 'Animals' },
  { icon: musik, name: 'Social & Lifestyle' },
  { icon: gaming, name: 'Arabic & Culture' },
  { icon: all, name: 'Sports' },
  
];

const Marquee = () => {
  return (
    <div className="marquee-container">
      <div className="marquee-content">
        {/* نعرض القائمة مرتين لتحقيق تأثير التمرير اللانهائي */}
        {[...categories,...categories, ...categories].map((category, index) => (
          <div className="category-item-marquee" key={index}>
            <img className="icon_marquee" src={category.icon}  /> 
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;