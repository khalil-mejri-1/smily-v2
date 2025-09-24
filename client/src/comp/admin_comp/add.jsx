import React, { useState } from 'react';
import axios from 'axios';
import NavbarAdmin from './navbar_admin';
import { categoryData } from '../../choix/choix';
import { FiPlusCircle, FiLoader, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const Add = () => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [bulkText, setBulkText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const allCategories = categoryData.reduce((acc, category) => {
        if (category.name === 'All') return acc;
        if (category.subCategories && category.subCategories.length > 0) {
            return acc.concat(category.subCategories);
        } else {
            return acc.concat(category.name);
        }
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFeedback({ type: '', message: '' });

        if (!selectedCategory || !bulkText.trim()) {
            setFeedback({ type: 'error', message: 'Please select a category and enter product data.' });
            return;
        }

        setIsSubmitting(true);

        // --- ✨ هذا هو الجزء الذي تم تعديله ---
        const lines = bulkText.trim().split('\n').filter(line => line.trim() !== '');
        const products = [];

        for (let i = 0; i < lines.length; i++) {
            const currentLine = lines[i].trim();
            const lastSpaceIndex = currentLine.lastIndexOf(' ');
            const potentialUrl = lastSpaceIndex > -1 ? currentLine.substring(lastSpaceIndex + 1) : '';

            // الحالة 1: العنوان والرابط في نفس السطر
            if (lastSpaceIndex > 0 && (potentialUrl.startsWith('http://') || potentialUrl.startsWith('https://'))) {
                const title = currentLine.substring(0, lastSpaceIndex).trim();
                products.push({ title, image: potentialUrl, category: selectedCategory, size: '6 CM' });
            } 
            // الحالة 2: العنوان في سطر والرابط في السطر التالي
            else if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine.startsWith('http://') || nextLine.startsWith('https://')) {
                    products.push({ title: currentLine, image: nextLine, category: selectedCategory, size: '6 CM' });
                    i++; // تخطي السطر التالي
                }
            }
        }
        // --- نهاية الجزء المعدل ---

        if (products.length === 0) {
            setFeedback({ type: 'error', message: 'No valid product data found. Check your formatting.' });
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await axios.post('https://smily-la3j.vercel.app/stickers/bulk', { products });
            setFeedback({ type: 'success', message: response.data.message });
            setBulkText('');
            setSelectedCategory('');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'An error occurred while adding products.';
            setFeedback({ type: 'error', message: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <NavbarAdmin />
            <div className="add-form-container">
                <form onSubmit={handleSubmit} className="add-form">
                    <h1 className="form-title">Add New Stickers</h1>
                    
                    {feedback.message && (
                        <div className={`feedback ${feedback.type}`}>
                            {feedback.type === 'success' ? <FiCheckCircle /> : <FiAlertTriangle />}
                            {feedback.message}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            required
                        >
                            <option value="" disabled>-- Select a category --</option>
                            {allCategories.map((cat, index) => (
                                <option key={index} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="bulk-data">Product Data</label>
                        <p className="instructions">
                            Enter each product on a new line. Format: <strong>Title ImageURL</strong>
                        </p>
                        <textarea
                            id="bulk-data"
                            rows="15"
                            placeholder="Naruto Uzumaki https://example.com/naruto.png&#10;--- OR ---&#10;Sasuke Uchiha&#10;https://example.com/sasuke.png"
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <><FiLoader className="spinner-icon" /><span>Adding...</span></>
                        ) : (
                            <><FiPlusCircle /><span>Add Products</span></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Add;