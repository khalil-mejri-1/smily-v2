import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import NavbarAdmin from './navbar_admin';
import { FiUser, FiMessageSquare, FiTrash2, FiLoader, FiAlertCircle, FiArchive } from 'react-icons/fi';

const ReviewAdmin = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:3002/ReviewAdmin');
            setReviews(res.data);
        } catch (err) {
            setError('Failed to load reviews.');
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleDeleteReview = async (reviewId) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            try {
                await axios.delete(`http://localhost:3002/ReviewAdmin/${reviewId}`);
                setReviews(prevReviews => prevReviews.filter(review => review._id !== reviewId));
            } catch (err) {
                alert('Failed to delete the review.');
                console.error('Error deleting review:', err);
            }
        }
    };

    if (loading) {
        // Class names for loading state
        return <div className="admin-review-status-container"><FiLoader className="admin-review-status-spinner" /></div>;
    }

    if (error) {
        // Class names for error state
        return <div className="admin-review-status-container"><FiAlertCircle /><h2>An Error Occurred</h2><p>{error}</p></div>;
    }

    return (
        <>
            <NavbarAdmin />
            {/* Main container for the review management page */}
            <div className="admin-review-page">
                <h1 className="admin-review-page__title">Customer Reviews</h1>
                {reviews.length > 0 ? (
                    // Grid container for all review cards
                    <div className="admin-review-grid">
                        {reviews.map((review) => (
                            // Individual review card
                            <div key={review._id} className="admin-review-card">
                                <div className="admin-review-card__header">
                                    <div className="admin-review-card__customer">
                                        <FiUser />
                                        <span>{review.customerName}</span>
                                    </div>
                                    <span className={`admin-review-card__status ${review.approved ? 'admin-review-card__status--approved' : 'admin-review-card__status--pending'}`}>
                                        {review.approved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                                <div className="admin-review-card__body">
                                    <FiMessageSquare className="admin-review-card__comment-icon" />
                                    <p className="admin-review-card__comment-text">"{review.comment}"</p>
                                    {review.imageUrl && (
                                        <img src={review.imageUrl} alt="Review" className="admin-review-card__image" />
                                    )}
                                </div>
                                <div className="admin-review-card__footer">
                                    <small>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </small>
                                    <button
                                        className="admin-review-card__delete-btn"
                                        onClick={() => handleDeleteReview(review._id)}
                                    >
                                        <FiTrash2 /> Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Empty state when no reviews are found
                    <div className="admin-review-empty-state">
                        <FiArchive />
                        <h3>No Reviews Found</h3>
                        <p>When a customer submits a review, it will appear here.</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default ReviewAdmin;