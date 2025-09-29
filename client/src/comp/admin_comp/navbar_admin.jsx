import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiGrid, FiPackage, FiClipboard } from "react-icons/fi"; // Icons for flair

const NavbarAdmin = () => {
    return (
        <nav className="navbar-admin">
            <div className="navbar-brand">
                <FiGrid />
                <span>Admin Panel</span>
            </div>
            <ul className="navbar-links">
                <li>
                    <NavLink 
                        to="/admin@admin1230123KHME@@@!!:^/Generate Stickers" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiPackage />
                        <span>Generate Stickers</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink 
                        to="/admin@admin1230123KHME@@@!:^" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Manage Orders</span>
                    </NavLink>
                </li>

                  <li>
                    <NavLink 
                        to="/admin@admin1230123KHME@@@!!:^/add Stickers" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Add stickres</span>
                    </NavLink>
                </li>
                

                 <li>
                    <NavLink 
                        to="/admin@admin1230123KHME@@@!!:^/Review" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Review</span>
                    </NavLink>
                </li>
                  <li>
                    <NavLink 
                        to="/admin@admin1230123KHME@@@!!:^/Manager Stickres" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Manager Stickres</span>
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
}

export default NavbarAdmin;