import  { useState } from 'react';
import Navbar from '../comp/navbar';
import Marquee from '../comp/Marquee';
import EnhancedCollage from '../comp/ImageCollage';
import BestSellers from '../comp/BestSellers';
import PopularCategories from '../comp/PopularCategories';

import '../index.css'; // سنقوم بإنشاء هذا الملف
import Footer from '../comp/Footer';
import StickerCarousel from '../comp/StickerCarousel';
import Review from '../comp/reviews';

function Home() {
  // نقلنا حالة فتح القائمة إلى المكون الأب (App)
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // دالة لتمريرها إلى Navbar للتحكم في الحالة
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className={`main-content ${isSidebarOpen ? 'blurred' : ''}`}>
       
      <Marquee />   
      <EnhancedCollage />

      </main>
<BestSellers/>
<PopularCategories/>
<Review/>
<Footer/>

    </>
  );
}

export default Home;