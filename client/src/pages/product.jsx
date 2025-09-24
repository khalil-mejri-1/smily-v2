import React from 'react';
import Navbar from '../comp/navbar';
import NewProductGrid from '../comp/page_product/product';
import CategoryScroller from '../comp/page_product/button_list';

const Product = () => {
    return (
        <div>
            <Navbar/>
            <br /><br /><br /><br />
            <CategoryScroller/>
            
            <br /><br /><br /><br />
            <NewProductGrid/>
        </div>
    );
}

export default Product;
