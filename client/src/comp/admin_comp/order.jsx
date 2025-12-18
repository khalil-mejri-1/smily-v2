import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

// استيراد الأيقونات
import {
  FiCheckCircle, FiXCircle, FiPhone, FiCalendar, FiUser, 
  FiAlertCircle, FiLoader, FiArchive, FiBox, FiDollarSign,
  FiTrash2, FiEdit, FiX, FiCopy // استيراد أيقونة النسخ
} from "react-icons/fi";
import NavbarAdmin from "./navbar_admin";

// ## مكون لافتة الحالة (Badge) ##
const StatusBadge = ({ status }) => {
  let statusClass = "";
  switch (status?.toLowerCase()) {
    case "pending": statusClass = "status-pending"; break;
    case "completed": statusClass = "status-completed"; break;
    case "cancelled": statusClass = "status-cancelled"; break;
    default: statusClass = "status-default";
  }
  return <span className={`status-badge ${statusClass}`}>{status}</span>;
};

// ## المكون الرئيسي لصفحة الطلبات ##
const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // حالة لتخزين الطلب المحدد لعرضه في النافذة المنبثقة
  const [selectedOrder, setSelectedOrder] = useState(null);

  // دالة لجلب الطلبات
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:3002/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load orders. Please try again later.");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ## دوال التعامل مع الإجراءات ##
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await axios.delete(`http://localhost:3002/orders/${orderId}`);
        fetchOrders(); // إعادة جلب الطلبات
        setSelectedOrder(null); // إغلاق النافذة المنبثقة
      } catch (err) {
        console.error("Error deleting order:", err);
        alert("Failed to delete order.");
      }
    }
  };

  const handleChangeStatus = async (orderId, currentStatus) => {
    // تحديد الحالة التالية في الدورة: Pending -> Completed -> Pending
    const nextStatus = currentStatus === "Pending" ? "Completed" : "Pending";
    try {
      await axios.put(`http://localhost:3002/orders/${orderId}/status`, { status: nextStatus });
      alert(`Order status changed to ${nextStatus}`);
      fetchOrders();
      setSelectedOrder(prev => prev ? { ...prev, status: nextStatus } : null);
    } catch (err) {
      console.error("Error changing status:", err);
      alert("Failed to change order status.");
    }
  };


  const handleApproval = async (reviewId, approved) => {
    try {
      // الخطوة 1: قم بإجراء الطلب إلى الخادم وانتظر الاستجابة
      // ستقوم الاستجابة الآن بإرجاع الطلب المحدث إذا تمت الموافقة
      const response = await axios.put(`http://localhost:3002/reviews/${reviewId}`, { approved });
      alert("Review status updated!");

      // الخطوة 2: تحديث الحالة في الواجهة الأمامية بالبيانات الصحيحة من الخادم
      // هذا يضمن أن السعر المحدث سيظهر فورًا ويبقى بعد إعادة التحميل
      if (response.data.order) {
        const updatedOrderFromServer = response.data.order;
        
        // تحديث الطلب المحدد في النافذة المنبثقة
        setSelectedOrder(updatedOrderFromServer);

        // تحديث الطلب في القائمة الرئيسية أيضًا
        setOrders(prevOrders =>
          prevOrders.map(order => 
            order._id === updatedOrderFromServer._id ? updatedOrderFromServer : order
          )
        );
      } else {
        // في حالة الرفض، قد لا يعود الطلب، لذا أعد جلب البيانات كإجراء احتياطي
        fetchOrders();
      }

    } catch (err) {
      console.error("Error updating review status:", err);
      alert("Failed to update review status.");
    }
  };

  // 🎉 دالة نسخ روابط صور المنتجات
  const handleCopyImageLinks = () => {
    if (!selectedOrder || !selectedOrder.items || selectedOrder.items.length === 0) {
      alert("No products or images to copy.");
      return;
    }

    // تصفية المنتجات التي لديها رابط صورة وجمع الروابط
    const imageLinks = selectedOrder.items
      .map(item => item.image)
      .filter(link => link); // تصفية الروابط الفارغة أو null

    const textToCopy = imageLinks.join('\n'); // دمج الروابط بفاصل سطر جديد

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          alert(`Copied ${imageLinks.length} image link(s) to clipboard!`);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          alert('Failed to copy links. Please try again.');
        });
    } else {
      alert("No image links found in this order to copy.");
    }
  };


  // عرض حالة التحميل
  if (loading) return <div className="loading-container"><FiLoader className="loading-spinner" /></div>;

  // عرض حالة الخطأ
  if (error) return <div className="error-container"><FiAlertCircle /><h2>An Error Occurred</h2><p>{error}</p></div>;
  
  // دالة لحساب العدد الإجمالي للمنتجات
  const getTotalProductQuantity = (items) => {
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  return (
    <>
      <NavbarAdmin />
      <div className="order-page-container">
        <h1 className="page-title">Customer Orders</h1>
        {orders.length > 0 ? (
          <div className="orders-grid">
            {orders.map((order) => (
              // ## بطاقة الطلب المبسطة ##
              <div key={order._id} className="order-card-simple" onClick={() => setSelectedOrder(order)}>
                <div className="card-simple-header">
                  <div className="customer-info-simple">
                    <FiUser size={18} />
                    <span className="customer-name-simple">{order.customerName}</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="card-simple-body">
                  <div className="info-item">
                    <FiPhone size={16} /> 
                    <span>{order.customerPhone}</span>
                  </div>
                  <div className="info-item">
                    <FiBox size={16} /> 
                    <span>{getTotalProductQuantity(order.items)} Products</span>
                  </div>
                  <div className="info-item total-price-simple">
                    <FiDollarSign size={16} />
                    <span>{order.totalPrice} DT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiArchive />
            <h3>No Orders Found</h3>
            <p>When a new order is placed, it will appear here.</p>
          </div>
        )}
      </div>

      {/* ## النافذة المنبثقة لعرض التفاصيل (Modal) ## */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}><FiX /></button>
            
            {/* 🎉 زر نسخ الروابط - تم إضافته هنا */}
            <button 
              className="btn btn-copy-links" 
              onClick={handleCopyImageLinks}
              style={{
                marginBottom: '15px',
                padding: '10px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px'
              }}
            >
              <FiCopy size={16} /> Copy Image Links
            </button>
            {/* نهاية زر نسخ الروابط */}
            
            {/* هنا نضع محتوى البطاقة المفصلة الأصلي */}
            <div className="order-card-detailed">
               <div className="card-header">
                 <div>
                   <h2 className="customer-name">{selectedOrder.customerName}</h2>
                   <p className="customer-phone"><FiPhone size={14} /> {selectedOrder.customerPhone}</p>
                 </div>
                 <StatusBadge status={selectedOrder.status} />
               </div>

               <div className="card-body">
                  <p className="section-title_order">Products</p>
                  <div className="products-list">
                    {selectedOrder.items.map((item) => (
                      <div key={item._id} className="product-item">
                          <div className="product-details-wrapper">
                             {item.image && <img src={item.image} alt={item.title} className="product-item-image"/>}
                             <div className="product-details">
                                <p className="product-title_order">{item.title}</p>
                                <p className="product-meta">Size: {item.size} &times; {item.quantity}</p>
                             </div>
                          </div>
                          <p className="product-price">{item.price}</p>
                        </div>
                    ))}
                  </div>
                  <div className="total-section">
                       <p className="total-label">TOTAL</p>
                       <p className="total-price">{selectedOrder.totalPrice} DT</p>
                   </div>
                </div>
                
                {selectedOrder.review && (
                  <div className="review-section">
                     {/* ... نفس قسم المراجعة من الكود الأصلي */}
                     <p className="section-title_order">Customer Review</p>
                     <div className="review-content">
                        <div className="review-text">
                          <p className="review-comment">"{selectedOrder.review.comment}"</p>
                          <p className="review-status">
                             Status: <span className={selectedOrder.review.approved ? 'review-status-approved' : 'review-status-pending'}>
                               {selectedOrder.review.approved ? " Approved" : " Pending"}
                             </span>
                          </p>
                        </div>
                     </div>
                     <div className="review-actions">
                        <button onClick={() => handleApproval(selectedOrder.review._id, true)} disabled={selectedOrder.review.approved === true} className="btn btn-approve"><FiCheckCircle/> Approve</button>
                        <button onClick={() => handleApproval(selectedOrder.review._id, false)} disabled={selectedOrder.review.approved === false} className="btn btn-reject"><FiXCircle/> Reject</button>
                     </div>
                   </div>
                 )}
                
                 <div className="card-footer modal-footer">
                      <div className="order-date">
                          <FiCalendar size={14} /> 
                          {new Date(selectedOrder.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="modal-actions">
                          <button className="btn btn-status" onClick={() => handleChangeStatus(selectedOrder._id, selectedOrder.status)}>
                              <FiEdit/> Change Status
                          </button>
                          <button className="btn btn-delete" onClick={() => handleDeleteOrder(selectedOrder._id)}>
                              <FiTrash2/> Delete Order
                          </button>
                      </div>
                 </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Order;