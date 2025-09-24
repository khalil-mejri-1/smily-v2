import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import NavbarAdmin from './navbar_admin';
import { FiEdit, FiTrash2, FiLoader, FiAlertCircle, FiSearch } from "react-icons/fi";

const StickresAdmin = () => {
    const [stickers, setStickers] = useState([]);
    const [loading, setLoading] = useState(false); // Set initial loading to false
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // --- ✨ States for server-side search ---
    const [searchQuery, setSearchQuery] = useState(''); // For the input field
    const [debouncedQuery, setDebouncedQuery] = useState(''); // For the API call after a delay
    
    const observer = useRef();

    // Effect to "debounce" the search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500); // Wait 500ms after user stops typing
        return () => clearTimeout(timer); // Cleanup
    }, [searchQuery]);

    // Effect to reset everything when a new search starts
    useEffect(() => {
        setStickers([]); // Clear old results
        setPage(1); // Go back to page 1
        setHasMore(true); // Reset hasMore
    }, [debouncedQuery]); // This runs only when the debounced query changes

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

    // Main effect to fetch data from the API
    useEffect(() => {
        const fetchStickers = async () => {
            setLoading(true);
            setError(null);
            try {
                // --- ✨ Add the debouncedQuery to the API request URL ---
                const url = `https://smily-la3j.vercel.app/stickers?page=${page}&limit=20&title=${debouncedQuery}`;
                const response = await axios.get(url);

                // Append new results to the list
                setStickers(prev => {
                    // Combine and filter for unique stickers to prevent duplicates
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
    // This effect now runs when the page or the search query changes
    }, [page, debouncedQuery]);

      const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this sticker?')) return;
        try {
            await axios.delete(`https://smily-la3j.vercel.app/stickers/${id}`);
            setStickers(stickers.filter(sticker => sticker._id !== id));
            // --- ✨ Decrement total count on successful deletion ---
            setTotalCount(prevCount => prevCount - 1);
        } catch (err) {
            alert('Failed to delete the sticker.');
        }
    };

    const handleUpdate = (id) => {
        alert(`Update functionality for sticker ID: ${id} is not implemented yet.`);
    };

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
                    <FiSearch className="search-icon" />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search all stickers in database..."
                        className="admin-search-input"
                    />
                </div>
                
                {error && <p>{error}</p>}

                {/* Initial message before any search */}
                {stickers.length === 0 && !loading && !searchQuery && (
                    <div className="loading-more-container">
                        <p>Type in the search bar to find stickers.</p>
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
                                {/* Card content... */}
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
                
                {!loading && stickers.length === 0 && debouncedQuery && (
                     <div className="loading-more-container"><p>No results found for "{debouncedQuery}".</p></div>
                )}
            </div>
        </div>
    );
}

export default StickresAdmin;