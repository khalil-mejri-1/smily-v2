import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import ProductGrid from "./comp/page_product/product";
import Product from "./pages/product";
import ProductDetail from "./pages/info_product";
import CartPage from "./pages/paneir";
import { Toaster } from "react-hot-toast";
import Admin from "./pages/admin";
import Order from "./comp/admin_comp/order";
import StickresAdmin from "./comp/admin_comp/stickres_admin";
import Add from "./comp/admin_comp/add";
import ClienLinks from "./comp/admin_comp/clien_links";
import ReviewAdmin from "./comp/admin_comp/Review";
import ModifierStickres from "./comp/admin_comp/modifier_stickres";

const App = () => {
  return (
    <div>
      <Toaster
        position="top-center" // مكان ظهور الإشعار
        toastOptions={{
          // يمكنك تخصيص شكل الإشعارات هنا
       success: {
      duration: 1500,
      style: {
        background: '#28a7468f',
        color: 'white',
        border: '1px solid #47d167ff',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      },
    },
          error: {
              duration: 1500,
            style: {
              background: "#e2435375",
               backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
              color: "white",
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<Product />} />

          <Route path="/ProductDetail" element={<ProductDetail />} />
          <Route path="/checkout" element={<CartPage />} />
          <Route path="/admin@admin1230123KHME@@@!:^" element={<Order/>} />
          <Route path="/admin@admin1230123KHME@@@!!:^/Generate Stickers" element={<StickresAdmin />} />
          <Route path="/admin@admin1230123KHME@@@!!:^/add Stickers"  element={<Add />} />
          <Route path="/admin@admin1230123KHME@@@!!:^/Review"  element={<ReviewAdmin />} />
          <Route path="/admin@admin1230123KHME@@@!!:^/Manager Stickres"  element={<ModifierStickres />} />

          <Route path="/*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
