import React, { useState, useEffect } from "react";
import axios from "axios";
import NavbarAdmin from "./navbar_admin";
import { categoryData } from "../../choix/choix";
import {
  FiPlusCircle,
  FiLoader,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import ClienLinks from "./clien_links";
// import ClienLinks from "./clien_links"; // ClienLinks is imported in its own file
// import Url from "./url"; // Assuming Url is another component

const Add = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // ✅ استرجاع الفئة من localStorage عند تحميل الصفحة
  useEffect(() => {
    const savedCategory = localStorage.getItem("selectedCategory");
    if (savedCategory) {
      setSelectedCategory(savedCategory);
    }
  }, []);

  // ✅ تخزين الفئة في localStorage عند التغيير
  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    localStorage.setItem("selectedCategory", value);
  };

  const allCategories = categoryData.reduce((acc, category) => {
    if (category.name === "All") return acc;
    if (category.subCategories && category.subCategories.length > 0) {
      // التأكد من استخلاص اسم الفئة الفرعية بشكل صحيح
      return acc.concat(category.subCategories.map(sub => sub.name || sub));
    } else {
      return acc.concat(category.name);
    }
  }, []);

  // ✅ معالجة الإضافة (من bulkText)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!selectedCategory || !bulkText.trim()) {
      setFeedback({
        type: "error",
        message: "Please select a category and enter product data.",
      });
      return;
    }

    setIsSubmitting(true);

    const lines = bulkText.trim().split("\n").filter((line) => line.trim() !== "");
    const products = [];
    let tempProduct = {};

    // منطق أكثر مرونة لاستخلاص المنتجات
    for (const line of lines) {
      const trimmedLine = line.trim();

      // 1. معالجة تنسيق (Title: / Image:)
      if (trimmedLine.toLowerCase().startsWith("title:")) {
        // إذا كان هناك منتج لم يكتمل، قم بإلغائه وبدء منتج جديد
        if (tempProduct.title && !tempProduct.image) tempProduct = {};
        tempProduct.title = trimmedLine.substring("Title:".length).trim();
      } else if (trimmedLine.toLowerCase().startsWith("image:")) {
        tempProduct.image = trimmedLine.substring("Image:".length).trim();
      }
      // 2. معالجة تنسيق سطر واحد (Title URL) أو (Title \n URL)
      else {
        const parts = trimmedLine.split(/\s+/);
        const lastPart = parts[parts.length - 1];

        // إذا كان السطر ينتهي بـ URL، فاعتبره تنسيق سطر واحد
        if (lastPart && lastPart.startsWith('http')) {
            const image = parts.pop();
            const title = parts.join(' ').trim();
            if (title) { // يجب أن يكون هناك عنوان
                products.push({
                    title: title,
                    image: image,
                    category: selectedCategory,
                    size: "6 CM",
                });
                tempProduct = {}; // مسح مؤقت بعد الإضافة
                continue;
            }
        }

        // إذا كان هذا السطر هو URL ويتبع عنواناً في السطر السابق (Title \n URL)
        if (tempProduct.title && !tempProduct.image && trimmedLine.startsWith('http')) {
            tempProduct.image = trimmedLine;
        }
      }

      // إضافة المنتج المكتمل
      if (tempProduct.title && tempProduct.image) {
        products.push({
          title: tempProduct.title,
          image: tempProduct.image,
          category: selectedCategory,
          size: "6 CM",
        });
        tempProduct = {};
      }
    }

    if (products.length === 0) {
      setFeedback({
        type: "error",
        message: "No valid product data found. Check your formatting.",
      });
      setIsSubmitting(false);
      return;
    }

    const BATCH_SIZE = 100;
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        try {
          await axios.post("http://localhost:3002/stickers/bulk", {
            products: batch,
          });
          successCount += batch.length;
          setFeedback({
            type: "info",
            message: `Adding products... (${i + batch.length}/${
              products.length
            })`,
          });
        } catch (error) {
          console.error("Error adding batch:", error);
          errorCount += batch.length;
        }
      }

      if (errorCount === 0) {
        setFeedback({
          type: "success",
          message: `Successfully added ${successCount} stickers!`,
        });
      } else {
        setFeedback({
          type: "error", // Changed from warning to error for clear feedback on failures
          message: `Completed with issues. Added ${successCount} stickers, but ${errorCount} failed. Check console for details.`,
        });
      }
      setBulkText("");
    } catch (finalError) {
      const errorMessage =
        finalError.response?.data?.message || "A network error occurred.";
      setFeedback({ type: "error", message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-app-container">
      <NavbarAdmin />

      {/* Container for Url and ClienLinks - Note: These components are not fully defined here */}
      <div style={{width:"100%", border:"red solid 0px", padding: '20px 0'}}>
        {/* <Url/> */}
        <ClienLinks/>
              </div>

      <div className="add-form-container">
        <form onSubmit={handleSubmit} className="add-form">
          <h1 className="form-title">Add New Stickers</h1>

          {feedback.message && (
            <div className={`feedback ${feedback.type}`}>
              {feedback.type === "success" ? (
                <FiCheckCircle size={20} />
              ) : feedback.type === "info" ? (
                <FiLoader size={20} className="spinner-icon" />
              ) : (
                <FiAlertTriangle size={20} />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
            >
              <option value="" disabled>
                -- Select a category --
              </option>
              {allCategories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bulk-data">Product Data</label>
            <p className="instructions">
              Enter each product on a new line. Format:{" "}
              <strong>Title ImageURL</strong>
              <br/>
              Or use two lines: <strong>Title: Product Name</strong> and <strong>Image: Image URL</strong>
            </p>
            <textarea
              id="bulk-data"
              rows="15"
              placeholder={`Example 1 (Title URL):
Naruto Uzumaki https://example.com/naruto.png

Example 2 (Title: / Image:):
Title: Sasuke Uchiha
Image: https://example.com/sasuke.png`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <FiLoader className="spinner-icon" size={20} />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <FiPlusCircle size={20} />
                <span>Add Products</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Add;