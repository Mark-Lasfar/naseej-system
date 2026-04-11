import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FaTruck, FaCheckCircle, FaBox, FaClock, FaMapMarkerAlt, 
  FaShoppingCart, FaArrowLeft, FaEnvelope, FaPhone, FaPrint,
  FaSync, FaDownload, FaShare, FaWhatsapp, FaEnvelopeOpenText,
  FaHistory, FaCalendarAlt, FaMoneyBillWave, FaTag, FaShippingFast
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const OrderTracking = () => {
  const { orderNumber: paramOrderNumber } = useParams();
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState(paramOrderNumber || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (paramOrderNumber) {
      setOrderNumber(paramOrderNumber);
      trackOrder(paramOrderNumber);
    }
  }, [paramOrderNumber]);

  const trackOrder = async (number = orderNumber) => {
    if (!number) {
      toast.error('Please enter an order number');
      return;
    }
    
    setLoading(true);
    setSearchAttempted(true);
    
    try {
      const response = await axios.get(`${API_URL}/orders/track/${number}`);
      setOrder(response.data);
      toast.success('Order found!');
    } catch (error) {
      console.error('Tracking error:', error);
      toast.error(error.response?.data?.error || 'Order not found');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrder = async () => {
    if (!order?.orderNumber) return;
    setRefreshing(true);
    try {
      const response = await axios.get(`${API_URL}/orders/track/${order.orderNumber}`);
      setOrder(response.data);
      toast.success('Order status updated');
    } catch (error) {
      toast.error('Failed to refresh order');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    trackOrder();
  };

  const shareOrder = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Order ${order?.orderNumber}`,
        text: `Check my order status on Naseej`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const shareViaWhatsApp = () => {
    const message = `My order ${order?.orderNumber} status: ${getStatusText(order?.orderStatus)}. Track here: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Order ${order?.orderNumber} Status`;
    const body = `My order status: ${getStatusText(order?.orderStatus)}\n\nTrack here: ${window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const downloadOrderDetails = () => {
    const content = `
NASEEJ ORDER DETAILS
====================
Order #: ${order?.orderNumber}
Date: ${new Date(order?.createdAt).toLocaleString()}
Status: ${getStatusText(order?.orderStatus)}

ITEMS:
${order?.items?.map(item => `- ${item.name} x${item.quantity} = ${formatPrice(item.unitPrice * item.quantity)} EGP`).join('\n')}

Totals:
Subtotal: ${formatPrice(order?.subtotal)} EGP
Shipping: ${order?.shippingCost === 0 ? 'Free' : `${formatPrice(order?.shippingCost)} EGP`}
Total: ${formatPrice(order?.totalAmount)} EGP

Shipping Address:
${order?.shippingAddress?.street}
${order?.shippingAddress?.district}, ${order?.shippingAddress?.city}
Phone: ${order?.shippingAddress?.phone}

Thank you for shopping with Naseej!
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order_${order?.orderNumber}_details.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Order details downloaded');
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaClock className="text-yellow-500 text-xl" />,
      confirmed: <FaCheckCircle className="text-blue-500 text-xl" />,
      processing: <FaBox className="text-purple-500 text-xl" />,
      shipped: <FaTruck className="text-orange-500 text-xl" />,
      delivered: <FaCheckCircle className="text-green-500 text-xl" />,
      cancelled: <FaCheckCircle className="text-red-500 text-xl" />,
      refunded: <FaMoneyBillWave className="text-gray-500 text-xl" />
    };
    return icons[status] || <FaClock className="text-gray-500 text-xl" />;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Order Placed',
      confirmed: 'Order Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    return texts[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      shipped: 'bg-orange-100 text-orange-800 border-orange-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProgressSteps = () => {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(order?.orderStatus);
    return steps.map((step, idx) => ({
      name: step,
      label: getStatusText(step),
      completed: idx <= currentIndex,
      active: idx === currentIndex
    }));
  };

  const getProgressWidth = () => {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(order?.orderStatus);
    if (currentIndex === -1 || order?.orderStatus === 'cancelled' || order?.orderStatus === 'refunded') return 0;
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (value) => {
    if (value === undefined || value === null) return '0';
    return Number(value).toLocaleString();
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  if (!paramOrderNumber && !searchAttempted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <FaTruck className="text-blue-600 text-3xl" />
          </div>
          <h1 className="text-2xl font-bold">Track Your Order</h1>
          <p className="text-gray-500 mt-2">Enter your order number to track your shipment</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter order number (e.g., ORD-1234567890)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <FaSync className="animate-spin" /> : <FaTruck />}
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Example: ORD-1700000000000-123</p>
            <p className="mt-2">You can find your order number in the confirmation email or SMS.</p>
          </div>
        </div>
      </div>
    );
  }

  const progressSteps = getProgressSteps();
  const progressWidth = getProgressWidth();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold">Track Your Order</h1>
        <div className="flex gap-2">
          {order && (
            <button
              onClick={refreshOrder}
              disabled={refreshing}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
            >
              <FaSync className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          )}
          <button 
            onClick={handlePrint}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
          >
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* Search Form (if accessed directly) */}
      {paramOrderNumber && (
        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter another order number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => trackOrder()}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Track Another
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : order ? (
        <div className="space-y-6">
          {/* Order Header */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-mono font-bold text-xl">{order.orderNumber}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <FaCalendarAlt size={12} />
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)}`}>
                  {getStatusText(order.orderStatus)}
                </div>
                <p className="text-2xl font-bold mt-2 text-blue-600">{formatPrice(order.totalAmount)} EGP</p>
              </div>
            </div>
            
            {order.trackingNumber && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-mono font-semibold">{order.trackingNumber}</p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  {progressSteps.map((step, idx) => (
                    <div key={idx} className={`text-center text-xs ${step.active ? 'text-blue-600 font-semibold' : step.completed ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.label}
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-500"
                    style={{ width: `${progressWidth}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <FaHistory className="text-blue-600" />
              Tracking History
            </h3>
            {order.trackingHistory?.length > 0 ? (
              <div className="relative">
                {order.trackingHistory.map((event, idx) => (
                  <div key={idx} className="flex gap-4 mb-6 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center z-10">
                        {getStatusIcon(event.status)}
                      </div>
                      {idx < order.trackingHistory.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="font-semibold">{getStatusText(event.status)}</p>
                      <p className="text-sm text-gray-600">{event.location}</p>
                      {event.note && <p className="text-sm text-gray-500 mt-1 italic">"{event.note}"</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tracking history available yet.</p>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FaShoppingCart className="text-blue-600" />
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.unitPrice * item.quantity)} EGP</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)} EGP</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span><FaTag className="inline mr-1" /> Discount</span>
                  <span>-{formatPrice(order.discount)} EGP</span>
                </div>
              )}
              <div className="flex justify-between">
                <span><FaShippingFast className="inline mr-1" /> Shipping</span>
                <span>{order.shippingCost === 0 ? 'Free' : `${formatPrice(order.shippingCost)} EGP`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice(order.totalAmount)} EGP</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-600" />
              Shipping Address
            </h3>
            <p>{order.shippingAddress?.street || 'N/A'}</p>
            <p>{order.shippingAddress?.district || ''} {order.shippingAddress?.city || 'N/A'}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><FaPhone /> {order.shippingAddress?.phone || 'N/A'}</span>
              {order.shippingAddress?.email && (
                <span className="flex items-center gap-1"><FaEnvelope /> {order.shippingAddress.email}</span>
              )}
            </div>
            {order.shippingAddress?.notes && (
              <p className="mt-2 text-sm text-gray-500 border-t pt-2">Notes: {order.shippingAddress.notes}</p>
            )}
          </div>

          {/* Estimated Delivery */}
          {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded' && (
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <FaCalendarAlt className="text-blue-600 text-2xl mx-auto mb-2" />
              <p className="text-gray-600">Estimated Delivery</p>
              <p className="font-bold text-lg">
                {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'Within 5-7 business days'}
              </p>
            </div>
          )}

          {/* Share Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FaShare className="text-blue-600" />
              Share Order
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={shareOrder}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <FaShare /> Share
              </button>
              <button
                onClick={shareViaWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <FaWhatsapp /> WhatsApp
              </button>
              <button
                onClick={shareViaEmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <FaEnvelopeOpenText /> Email
              </button>
              <button
                onClick={downloadOrderDetails}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <FaDownload /> Download
              </button>
            </div>
          </div>

          {/* Need Help */}
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-gray-600">Need help with your order?</p>
            <p className="text-sm text-gray-500 mt-1">
              Contact our customer support at <strong>support@naseej.com</strong> or call <strong>+20 123 456 789</strong>
            </p>
            <Link to="/shop" className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm">
              Continue Shopping →
            </Link>
          </div>
        </div>
      ) : searchAttempted && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">We couldn't find an order with the number "{orderNumber}"</p>
          <button 
            onClick={() => setSearchAttempted(false)} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none;
          }
          body {
            background: white;
          }
          .shadow-sm {
            box-shadow: none;
            border: 1px solid #ddd;
          }
          button {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderTracking;