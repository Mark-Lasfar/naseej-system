import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaEye, FaTruck, FaCheck, FaTimes, FaBox, FaMoneyBillWave,
  FaUser, FaCalendarAlt, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaPrint, FaDownload, FaFilter, FaSearch, FaChevronDown,
  FaChevronUp, FaSpinner, FaStar, FaRegStar, FaInfoCircle,
  FaClock, FaShippingFast, FaReceipt
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, statusFilter, dateRange, sortBy]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/seller/orders`);
      setOrders(response.data);
      calculateStats(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrders = ordersData.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'confirmed').length;
    const deliveredOrders = ordersData.filter(o => o.orderStatus === 'delivered').length;
    const cancelledOrders = ordersData.filter(o => o.orderStatus === 'cancelled').length;
    
    setStats({
      totalOrders: ordersData.length,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      cancelledOrders
    });
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(term) ||
        order.customerId?.name?.toLowerCase().includes(term) ||
        order.customerId?.phone?.includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(order => new Date(order.createdAt) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(order => new Date(order.createdAt) <= new Date(dateRange.end));
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'amount_high':
        filtered.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
        break;
      case 'amount_low':
        filtered.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredOrders(filtered);
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_URL}/seller/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <FaClock />, label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: <FaCheck />, label: 'Confirmed' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: <FaSpinner />, label: 'Processing' },
      shipped: { color: 'bg-indigo-100 text-indigo-800', icon: <FaTruck />, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', icon: <FaCheck />, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <FaTimes />, label: 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setSortBy('newest');
  };

  const exportOrders = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }
    
    const csv = filteredOrders.map(order => ({
      'Order #': order.orderNumber,
      'Customer': order.customerId?.name,
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Total': order.totalAmount,
      'Status': order.orderStatus,
      'Items': order.items?.length
    }));
    
    const headers = Object.keys(csv[0] || {});
    const csvContent = [
      headers.join(','),
      ...csv.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Orders exported successfully');
  };

  const printOrder = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Order Details</h1>
          <p><strong>Order #:</strong> ${order.orderNumber}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Customer:</strong> ${order.customerId?.name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${order.customerId?.phone || 'N/A'}</p>
          <p><strong>Status:</strong> ${order.orderStatus}</p>
          <h2>Items</h2>
          <table>
            <thead>
              <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              ${order.items?.map(item => `
                <tr>
                  <td>${item.name || 'Product'}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unitPrice?.toLocaleString()} EGP</td>
                  <td>${item.subtotal?.toLocaleString()} EGP</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <strong>Total: ${order.totalAmount?.toLocaleString()} EGP</strong>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Store Orders
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all your store orders</p>
        </div>
        <button
          onClick={exportOrders}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <FaDownload /> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <FaBox className="text-blue-500 text-2xl mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <FaMoneyBillWave className="text-green-500 text-2xl mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} EGP</p>
          <p className="text-xs text-gray-500">Total Revenue</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <FaClock className="text-yellow-500 text-2xl mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <FaCheck className="text-green-500 text-2xl mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.deliveredOrders}</p>
          <p className="text-xs text-gray-500">Delivered</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center col-span-2 sm:col-span-1">
          <FaTimes className="text-red-500 text-2xl mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.cancelledOrders}</p>
          <p className="text-xs text-gray-500">Cancelled</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order #, customer name or phone..."
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_high">Highest Amount</option>
            <option value="amount_low">Lowest Amount</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <FaFilter /> Filters
            {showFilters ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {(searchTerm || statusFilter !== 'all' || dateRange.start || dateRange.end) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
            >
              <FaTimes /> Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Order #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Items</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order._id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono text-sm">
                    <button
                      onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {order.orderNumber}
                    </button>
                   </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{order.customerId?.name}</p>
                      <p className="text-xs text-gray-500">{order.customerId?.phone}</p>
                    </div>
                   </td>
                  <td className="px-6 py-4 text-sm">
                    {moment(order.createdAt).format('MMM DD, YYYY')}
                    <p className="text-xs text-gray-400">{moment(order.createdAt).format('h:mm A')}</p>
                   </td>
                  <td className="px-6 py-4 text-right text-sm">{order.items?.length || 0} items</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">
                    {order.totalAmount?.toLocaleString()} EGP
                   </td>
                  <td className="px-6 py-4">{getStatusBadge(order.orderStatus)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {order.orderStatus === 'pending' && (
                        <button
                          onClick={() => updateStatus(order._id, 'processing')}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Process Order"
                        >
                          <FaSpinner />
                        </button>
                      )}
                      {order.orderStatus === 'processing' && (
                        <button
                          onClick={() => updateStatus(order._id, 'shipped')}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Mark as Shipped"
                        >
                          <FaTruck />
                        </button>
                      )}
                      {order.orderStatus === 'shipped' && (
                        <button
                          onClick={() => updateStatus(order._id, 'delivered')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Mark as Delivered"
                        >
                          <FaCheck />
                        </button>
                      )}
                      {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                        <button
                          onClick={() => updateStatus(order._id, 'cancelled')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Cancel Order"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Cards - Mobile & Tablet */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.map(order => (
          <div key={order._id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-start mb-3">
              <button
                onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                {order.orderNumber}
              </button>
              {getStatusBadge(order.orderStatus)}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium">{order.customerId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span>{order.customerId?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{moment(order.createdAt).format('MMM DD, YYYY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items:</span>
                <span>{order.items?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="font-bold text-blue-600">{order.totalAmount?.toLocaleString()} EGP</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <button
                onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <FaEye /> View
              </button>
              {order.orderStatus === 'pending' && (
                <button
                  onClick={() => updateStatus(order._id, 'processing')}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <FaSpinner /> Process
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500">No orders found</p>
          <button onClick={clearFilters} className="mt-4 text-blue-600 hover:text-blue-800">
            Clear filters
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Header */}
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-mono text-lg font-bold">{selectedOrder.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p>{moment(selectedOrder.createdAt).format('MMMM DD, YYYY - h:mm A')}</p>
                </div>
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Order Status</p>
                {getStatusBadge(selectedOrder.orderStatus)}
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FaUser /> Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <p><span className="text-gray-500">Name:</span> {selectedOrder.customerId?.name}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedOrder.customerId?.phone}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedOrder.customerId?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FaMapMarkerAlt /> Shipping Address
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.district}</p>
                    <p>Phone: {selectedOrder.shippingAddress.phone}</p>
                    {selectedOrder.shippingAddress.notes && (
                      <p className="text-gray-500 text-sm mt-2">Notes: {selectedOrder.shippingAddress.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FaBox /> Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.subtotal?.toLocaleString()} EGP</p>
                        <p className="text-xs text-gray-500">{item.unitPrice?.toLocaleString()} EGP each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{selectedOrder.subtotal?.toLocaleString()} EGP</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{selectedOrder.discount.toLocaleString()} EGP</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{selectedOrder.shippingCost === 0 ? 'Free' : `${selectedOrder.shippingCost?.toLocaleString()} EGP`}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-lg">
                    <span>Total</span>
                    <span className="text-blue-600">{selectedOrder.totalAmount?.toLocaleString()} EGP</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <button
                  onClick={() => printOrder(selectedOrder)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-300"
                >
                  <FaPrint /> Print
                </button>
                {selectedOrder.orderStatus === 'pending' && (
                  <button
                    onClick={() => { updateStatus(selectedOrder._id, 'processing'); setShowModal(false); }}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <FaSpinner /> Process Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrders;