import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import NavbarAdmin from './navbar_admin';
import { FiEdit, FiTrash2, FiLoader, FiAlertCircle, FiSearch, FiXCircle } from "react-icons/fi";
import { categoryData } from '../../choix/choix';

const StickresAdmin = () => {
    const [stickers, setStickers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    
    // ✅ New states for category-based deletion and count
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categoryCount, setCategoryCount] = useState(0);

    const observer = useRef();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setStickers([]);
        setPage(1);
        setHasMore(true);
    }, [debouncedQuery, selectedCategory]); // ✅ Reset when selectedCategory changes too

    const lastStickerElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // ✅ New useEffect to fetch sticker count for the selected category
    useEffect(() => {
        const fetchCategoryCount = async () => {
            if (!selectedCategory) {
                setCategoryCount(0);
                return;
            }
            try {
                const response = await axios.get(`http://localhost:3002/stickers/count?category=${selectedCategory}`);
                setCategoryCount(response.data.count);
            } catch (err) {
                console.error("Failed to fetch category count:", err);
                setCategoryCount(0);
            }
        };

        fetchCategoryCount();
    }, [selectedCategory]);

    useEffect(() => {
        const fetchStickers = async () => {
            setLoading(true);
            setError(null);
            try {
                const url = `http://localhost:3002/stickers?page=${page}&limit=20&title=${debouncedQuery}&category=${selectedCategory}`;
                const response = await axios.get(url);

                setStickers(prev => {
                    const allStickers = [...prev, ...response.data.items];
                    return allStickers.filter((s, i, self) => i === self.findIndex(t => t._id === s._id));
                });
                
                if (response.data.totalItems !== undefined) {
                    setTotalCount(response.data.totalItems);
                }
                
                setHasMore(response.data.hasNextPage);

            } catch (err) {
                setError('Failed to fetch stickers.');
            } finally {
                setLoading(false);
            }
        };

        fetchStickers();
    }, [page, debouncedQuery, selectedCategory]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this sticker?')) return;
        try {
            await axios.delete(`http://localhost:3002/stickers/${id}`);
            setStickers(stickers.filter(sticker => sticker._id !== id));
            setTotalCount(prevCount => prevCount - 1);
            // ✅ Update category count after deletion
            setCategoryCount(prevCount => prevCount - 1);
        } catch (err) {
            alert('Failed to delete the sticker.');
        }
    };

    // ✅ New function to handle bulk deletion
    const handleDeleteCategory = async () => {
        if (!selectedCategory || !window.confirm(`Are you sure you want to delete ALL ${categoryCount} stickers from the category: ${selectedCategory}?`)) {
            return;
        }
        try {
            const response = await axios.delete(`http://localhost:3002/stickers/category/${selectedCategory}`);
            alert(response.data.message);
            // ✅ Reset states after successful deletion
            setStickers([]);
            setPage(1);
            setHasMore(true);
            setTotalCount(prevCount => prevCount - response.data.deletedCount);
            setCategoryCount(0);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete stickers by category.';
            alert(errorMessage);
        }
    };

    const handleUpdate = (id) => {
        alert(`Update functionality for sticker ID: ${id} is not implemented yet.`);
    };

    const allCategories = categoryData.reduce((acc, category) => {
        if (category.name === 'All') return acc;
        if (category.subCategories && category.subCategories.length > 0) {
            return acc.concat(category.subCategories);
        } else {
            return acc.concat(category.name);
        }
    }, []);

    return (
        <div>
            <NavbarAdmin />
            <div className="admin-container">
                <div className="admin-header">
                    <h1 className="admin-title">Manage Stickers</h1>
                     <span className="sticker-count-badge">
                        {totalCount} stickers in DB
                    </span>
                </div>

                <div className="admin-search-container">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title..."
                        className="admin-search-input"
                    />
                </div>
                
                {/* ✅ New UI for category deletion */}
                <div className="admin-category-actions">
                    <div className="category-select-group">
                        <label htmlFor="category-select">Select Category to Delete:</label>
                        <select 
                            id="category-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">-- Select a category --</option>
                            {allCategories.map((cat, index) => (
                                <option key={index} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {selectedCategory && (
                             <span className="category-count">
                                {categoryCount} stickers
                             </span>
                        )}
                    </div>
                    <button 
                        className="btn-delete-all"
                        onClick={handleDeleteCategory}
                        disabled={!selectedCategory || categoryCount === 0}
                    >
                        <FiTrash2 /> Delete All
                    </button>
                </div>
                
                {error && <p className="error-message">{error}</p>}
                
                {stickers.length === 0 && !loading && !searchQuery && !selectedCategory && (
                    <div className="loading-more-container">
                        <p>Type in the search bar or select a category to view stickers.</p>
                    </div>
                )}
                
                <div className="stickers-grid">
                    {stickers.map((sticker, index) => {
                        const isLastElement = stickers.length === index + 1;
                        return (
                            <div 
                                className="sticker-card-admin" 
                                ref={isLastElement ? lastStickerElementRef : null} 
                                key={sticker._id}
                            >
                                <img src={sticker.image} alt={sticker.title} className="sticker-image-admin" />
                                <div className="card-content">
                                    <h3 className="sticker-title-admin">{sticker.title}</h3>
                                    <p className="sticker-category-admin">{sticker.category}</p>
                                </div>
                                <div className="card-actions">
                                    <button className="btn-update" onClick={() => handleUpdate(sticker._id)}><FiEdit /> Update</button>
                                    <button className="btn-delete" onClick={() => handleDelete(sticker._id)}><FiTrash2 /> Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {loading && <div className="loading-more-container"><FiLoader className="spinner-icon" /><p>Loading...</p></div>}
                
                {!loading && stickers.length === 0 && (searchQuery || selectedCategory) && (
                    <div className="loading-more-container">
                         <p>No results found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StickresAdmin;