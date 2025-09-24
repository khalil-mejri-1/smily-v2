import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="pro-sticker-card skeleton-card">
      <div className="shimmer-wrapper">
        <div className="skeleton-image"></div>
        <div className="skeleton-body">
          <div className="skeleton-title"></div>
          <div className="skeleton-footer">
            <div className="skeleton-price"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;