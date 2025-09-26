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
import Url from "./url";

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
      return acc.concat(category.subCategories);
    } else {
      return acc.concat(category.name);
    }
  }, []);



  // ✅ دالة تجلب صفحة معينة وتنتظر 20 ثانية قبل الصفحة التالية
  // ✅ دالة تجلب صفحتين فقط وبدون انتظار


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

    const lines = bulkText
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "");
    const products = [];
    let tempProduct = {};

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("Title:")) {
        tempProduct.title = trimmedLine.substring("Title:".length).trim();
      } else if (trimmedLine.startsWith("Image:")) {
        tempProduct.image = trimmedLine.substring("Image:".length).trim();
      }

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
          type: "warning",
          message: `Completed with some issues. Added ${successCount} stickers, but ${errorCount} failed.`,
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
    <div>
      <NavbarAdmin />
<div style={{display:"flex", maxWidth:"1200px", margin:" auto"}}>
 {/* <Url/> */}

      <ClienLinks />

</div>
     

      <div className="add-form-container">
        <form onSubmit={handleSubmit} className="add-form">
          <h1 className="form-title">Add New Stickers</h1>

          {feedback.message && (
            <div className={`feedback ${feedback.type}`}>
              {feedback.type === "success" ? (
                <FiCheckCircle />
              ) : (
                <FiAlertTriangle />
              )}
              {feedback.message}
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
            </p>
            <textarea
              id="bulk-data"
              rows="15"
              placeholder={`Naruto Uzumaki https://example.com/naruto.png

--- OR ---

Sasuke Uchiha
https://example.com/sasuke.png`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <FiLoader className="spinner-icon" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <FiPlusCircle />
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
