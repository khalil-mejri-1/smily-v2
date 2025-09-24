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
                        to="***REDACTED***/Generate Stickers" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiPackage />
                        <span>Generate Stickers</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink 
                        to="***REDACTED***" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Manage Orders</span>
                    </NavLink>
                </li>

                  <li>
                    <NavLink 
                        to="***REDACTED***/add Stickers" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Add stickres</span>
                    </NavLink>
                </li>
                  <li>
                    <NavLink 
                        to="***REDACTED***/clain links" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Clain links</span>
                    </NavLink>
                </li>

                 <li>
                    <NavLink 
                        to="***REDACTED***/Review" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        <FiClipboard />
                        <span>Review</span>
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
}

export default NavbarAdmin;