import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiGrid, FiPackage, FiClipboard } from "react-icons/fi"; // Icons for flair

const ADMIN_ORDERS_PATH = import.meta.env.VITE_ADMIN_ORDERS_PATH || "/admin-orders";
const ADMIN_PREFIX_PATH = import.meta.env.VITE_ADMIN_PREFIX_PATH || "/admin";

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
                        to={`${ADMIN_PREFIX_PATH}/Generate Stickers`} 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiPackage />
                        <span>Generate Stickers</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink 
                        to={ADMIN_ORDERS_PATH} 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Manage Orders</span>
                    </NavLink>
                </li>

                  <li>
                    <NavLink 
                        to={`${ADMIN_PREFIX_PATH}/add Stickers`} 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Add stickres</span>
                    </NavLink>
                </li>
                

                 <li>
                    <NavLink 
                        to={`${ADMIN_PREFIX_PATH}/Review`} 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Review</span>
                    </NavLink>
                </li>
                  <li>
                    <NavLink 
                        to={`${ADMIN_PREFIX_PATH}/Manager Stickres`} 
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