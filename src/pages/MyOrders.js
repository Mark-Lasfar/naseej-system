import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  FaEye, FaTruck, FaBox, FaCheckCircle, FaClock, FaSync, 
  FaDownload, FaPrint, FaTimes, FaShoppingCart, FaMoneyBillWave,
  FaSearch, FaFilter, FaCalendarAlt, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, dateRange, orders]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders(Array.isArray(response.data) ? response.data : []);
      setFilteredOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
    toast.success('Orders refreshed');
  };

  const filterOrders = () => {
    let filtered = [...orders];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(term) ||
        order.items?.some(item => item.name?.toLowerCase().includes(term))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }
    
    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(order => new Date(order.createdAt) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      filtered = filtered.filter(order => new Date(order.createdAt) <= new Date(dateRange.to));
    }
    
    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <FaClock className="text-yellow-500" />, text: 'Pending', bg: 'bg-yellow-50 border-yellow-200' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: <FaCheckCircle className="text-blue-500" />, text: 'Confirmed', bg: 'bg-blue-50 border-blue-200' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: <FaBox className="text-purple-500" />, text: 'Processing', bg: 'bg-purple-50 border-purple-200' },
      shipped: { color: 'bg-orange-100 text-orange-800', icon: <FaTruck className="text-orange-500" />, text: 'Shipped', bg: 'bg-orange-50 border-orange-200' },
      delivered: { color: 'bg-green-100 text-green-800', icon: <FaCheckCircle className="text-green-500" />, text: 'Delivered', bg: 'bg-green-50 border-green-200' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <FaTimes className="text-red-500" />, text: 'Cancelled', bg: 'bg-red-50 border-red-200' },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: <FaMoneyBillWave className="text-gray-500" />, text: 'Refunded', bg: 'bg-gray-50 border-gray-200' }
    };
    return badges[status] || badges.pending;
  };

  const getProgressSteps = (status) => {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, idx) => ({
      name: step,
      label: getStatusBadge(step).text,
      completed: idx <= currentIndex,
      active: idx === currentIndex
    }));
  };

  const getEstimatedDelivery = (order) => {
    const created = new Date(order.createdAt);
    const estimated = new Date(created);
    estimated.setDate(created.getDate() + 5);
    return estimated;
  };

  const downloadInvoice = (order) => {
    // Simple invoice download functionality
    const invoiceContent = `
      NASEEJ INVOICE
      ===============
      Order #: ${order.orderNumber}
      Date: ${new Date(order.createdAt).toLocaleString()}
      
      Items:
      ${order.items?.map(item => `- ${item.name} x${item.quantity} = ${(item.unitPrice * item.quantity).toLocaleString()} EGP`).join('\n')}
      
      Subtotal: ${order.subtotal?.toLocaleString()} EGP
      Shipping: ${order.shippingCost === 0 ? 'Free' : `${order.shippingCost?.toLocaleString()} EGP`}
      Total: ${order.totalAmount?.toLocaleString()} EGP
      
      Thank you for shopping with Naseej!
    `;
    
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${order.orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded');
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    shipped: orders.filter(o => o.orderStatus === 'shipped').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    totalSpent: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage your orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshOrders} disabled={refreshing} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <FaSync className={`${refreshing ? 'animate-spin' : ''}`} size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.shipped}</p>
          <p className="text-xs text-gray-500">Shipped</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.totalSpent.toLocaleString()} EGP</p>
          <p className="text-xs text-gray-500">Total Spent</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order # or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <FaFilter /> Filters
            {showFilters ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={() => { setDateRange({ from: '', to: '' }); setSearchTerm(''); setStatusFilter('all'); }}
              className="self-end px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders List */}
      {!filteredOrders || filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to
              ? 'No orders match your filters.'
              : "You haven't placed any orders yet."}
          </p>
          {(searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to) ? (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateRange({ from: '', to: '' }); }} className="text-blue-600 hover:text-blue-800">
              Clear all filters
            </button>
          ) : (
            <Link to="/shop" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              <FaShoppingCart className="inline mr-2" /> Start Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const status = getStatusBadge(order.orderStatus);
            const progressSteps = getProgressSteps(order.orderStatus);
            const isExpanded = expandedOrder === order._id;
            
            return (
              <div key={order._id} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition ${status.bg}`}>
                {/* Order Header */}
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-500">Order #</p>
                        <p className="font-mono font-semibold text-lg">{order.orderNumber}</p>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <FaCalendarAlt size={12} />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${status.color}`}>
                        {status.icon}
                        {status.text}
                      </span>
                      <p className="text-xl font-bold mt-2 text-blue-600">{order.totalAmount?.toLocaleString() || 0} EGP</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded' && (
                    <div className="mt-4 pt-2">
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
                          style={{ width: `${(progressSteps.filter(s => s.completed).length / progressSteps.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Order Items Summary */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex flex-wrap justify-between items-center">
                      <div className="flex flex-wrap gap-3">
                        {order.items && order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {item.productId?.imageUrl && (
                              <img src={item.productId.imageUrl} alt={item.name} className="w-8 h-8 object-cover rounded" />
                            )}
                            <span className="text-sm text-gray-600">
                              {item.name || 'Product'} <span className="text-gray-400">x{item.quantity}</span>
                            </span>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <span className="text-sm text-gray-500">+{order.items.length - 2} more</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                        >
                          <FaEye /> {isExpanded ? 'Show Less' : 'View Details'}
                        </button>
                        <Link 
                          to={`/order-tracking/${order.orderNumber}`}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
                        >
                          <FaTruck /> Track
                        </Link>
                        <button
                          onClick={() => downloadInvoice(order)}
                          className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
                        >
                          <FaDownload /> Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t px-6 py-4 bg-gray-50 rounded-b-xl">
                    <h4 className="font-semibold mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity} x {item.unitPrice?.toLocaleString()} EGP
                            </p>
                          </div>
                          <p className="font-semibold">{(item.unitPrice * item.quantity).toLocaleString()} EGP</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{order.subtotal?.toLocaleString()} EGP</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-{order.discount.toLocaleString()} EGP</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{order.shippingCost === 0 ? 'Free' : `${order.shippingCost?.toLocaleString()} EGP`}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                        <span>Total</span>
                        <span className="text-blue-600">{order.totalAmount?.toLocaleString()} EGP</span>
                      </div>
                    </div>
                    
                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold mb-2">Shipping Address</h4>
                        <p className="text-sm">{order.shippingAddress.street}</p>
                        <p className="text-sm">{order.shippingAddress.district}, {order.shippingAddress.city}</p>
                        <p className="text-sm">Phone: {order.shippingAddress.phone}</p>
                      </div>
                    )}
                    
                    {/* Estimated Delivery */}
                    {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-500">
                          Estimated Delivery: {getEstimatedDelivery(order).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end gap-2">
                      <Link 
                        to={`/order-tracking/${order.orderNumber}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FaTruck /> Track Order
                      </Link>
                      <button
                        onClick={() => downloadInvoice(order)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 flex items-center gap-2"
                      >
                        <FaPrint /> Print Invoice
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Results Count */}
      {filteredOrders.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      )}
    </div>
  );
};

export default MyOrders;