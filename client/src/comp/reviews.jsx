import React, { useState, useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch("http://localhost:3002/reviews");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        const approvedReviews = data.filter(
          (review) => review.approved === true
        );
        setReviews(approvedReviews);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const slide = (direction) => {
    const slider = sliderRef.current;
    if (slider) {
      const firstCard = slider.querySelector(".review-card");
      if (firstCard) {
        const gap = parseFloat(window.getComputedStyle(slider).gap);
        const scrollAmount = firstCard.offsetWidth + gap;

        slider.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  if (loading)
    return (
      <p style={{ textAlign: "center", marginTop: "250px" }}>
        Loading reviews...
      </p>
    );
  if (error) return <p className="reviews-status">Error: {error}</p>;

  return (
    <section className="reviews-section">
      <div className="reviews-header">
        <h2>What customers say about us</h2>
        <p>We do our best to provide you the best experience ever</p>
      </div>

      <div className="slider-container">
        <button
          className="slider-arrow left"
          onClick={() => slide("left")}
          aria-label="Previous review"
        >
          <FiChevronLeft />
        </button>

        <div className="reviews-slider" ref={sliderRef}>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div className="review-card" key={review._id}>
                <div
                  style={{ display: "flex", gap: "20px", alignItems: "center" }}
                >
                  <div className="initial-avatar">
                    <span>{review.customerName[0]}</span>
                  </div>
                  <div className="review-content-header">
                    <h3 style={{position:"relative",top:"-2px", fontSize:"22px", fontWeight:"500"}}>
                      {review.customerName.charAt(0).toUpperCase() +
                        review.customerName.slice(1)}
                    </h3>{" "}
                  </div>
                </div>
                <hr />
                <p className="review-comment">"{review.comment}"</p>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))
          ) : (
            <p className="no-reviews">No approved reviews yet. Be the first!</p>
          )}
        </div>

        <button
          className="slider-arrow right"
          onClick={() => slide("right")}
          aria-label="Next review"
        >
          <FiChevronRight />
        </button>
      </div>
    </section>
  );
};

export default Reviews;
