import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaEye, FaTruck, FaCheck, FaTimes, FaPrint, 
  FaFilter, FaDownload, FaSync, FaSearch, FaClock,
  FaBox, FaUser, FaMoneyBillWave, FaMapMarkerAlt
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [trackingInput, setTrackingInput] = useState('');

  const ordersPerPage = 20;

  useEffect(() => {
    fetchOrders();
  }, [filter, currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/orders?page=${currentPage}&limit=${ordersPerPage}`;
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      if (dateRange.from) {
        url += `&fromDate=${dateRange.from}`;
      }
      if (dateRange.to) {
        url += `&toDate=${dateRange.to}`;
      }
      
      const response = await axios.get(url);
      const data = response.data;
      setOrders(data.orders || data);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status, trackingNumber = '') => {
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, {
        status,
        trackingNumber
      });
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Order #', 'Customer', 'Phone', 'Date', 'Total', 'Status', 'Payment'];
    const rows = orders.map(order => [
      order.orderNumber,
      order.customerId?.name || 'N/A',
      order.customerId?.phone || 'N/A',
      new Date(order.createdAt).toLocaleDateString(),
      order.totalAmount,
      order.orderStatus,
      order.paymentStatus
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const refreshOrders = () => {
    fetchOrders();
    toast.success('Orders refreshed');
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(term) ||
      order.customerId?.name?.toLowerCase().includes(term) ||
      order.customerId?.phone?.includes(term)
    );
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <FaClock size={12} />, label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: <FaCheck size={12} />, label: 'Confirmed' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: <FaBox size={12} />, label: 'Processing' },
      shipped: { color: 'bg-orange-100 text-orange-800', icon: <FaTruck size={12} />, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', icon: <FaCheck size={12} />, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <FaTimes size={12} />, label: 'Cancelled' }
    };
    return badges[status] || badges.pending;
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', action: 'Mark Pending', color: 'bg-yellow-500' },
    { value: 'confirmed', label: 'Confirmed', action: 'Confirm', color: 'bg-blue-500' },
    { value: 'processing', label: 'Processing', action: 'Start Processing', color: 'bg-purple-500' },
    { value: 'shipped', label: 'Shipped', action: 'Mark Shipped', color: 'bg-orange-500' },
    { value: 'delivered', label: 'Delivered', action: 'Mark Delivered', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', action: 'Cancel', color: 'bg-red-500' }
  ];

  const stats = {
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    confirmed: orders.filter(o => o.orderStatus === 'confirmed').length,
    processing: orders.filter(o => o.orderStatus === 'processing').length,
    shipped: orders.filter(o => o.orderStatus === 'shipped').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
    total: orders.length
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <div className="flex gap-2">
          <button onClick={refreshOrders} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportToCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order #, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              placeholder="From"
            />
            <span className="self-center">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              placeholder="To"
            />
            <button onClick={fetchOrders} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} color="gray" onClick={() => setFilter('all')} active={filter === 'all'} />
        <StatCard label="Pending" value={stats.pending} color="yellow" onClick={() => setFilter('pending')} active={filter === 'pending'} />
        <StatCard label="Confirmed" value={stats.confirmed} color="blue" onClick={() => setFilter('confirmed')} active={filter === 'confirmed'} />
        <StatCard label="Processing" value={stats.processing} color="purple" onClick={() => setFilter('processing')} active={filter === 'processing'} />
        <StatCard label="Shipped" value={stats.shipped} color="orange" onClick={() => setFilter('shipped')} active={filter === 'shipped'} />
        <StatCard label="Delivered" value={stats.delivered} color="green" onClick={() => setFilter('delivered')} active={filter === 'delivered'} />
        <StatCard label="Cancelled" value={stats.cancelled} color="red" onClick={() => setFilter('cancelled')} active={filter === 'cancelled'} />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const status = getStatusBadge(order.orderStatus);
                return (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm font-medium">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{order.customerId?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{order.customerId?.phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-semibold">{order.totalAmount.toLocaleString()} EGP</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedOrder(order)} className="text-blue-600 hover:text-blue-800" title="View Details">
                          <FaEye />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800" title="Print">
                          <FaPrint />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">No orders found.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateOrderStatus}
          statusOptions={statusOptions}
          updating={updating}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, color, onClick, active }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800'
  };
  
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer transition-all ${
        active ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
      }`}
    >
      <p className={`text-2xl font-bold ${colors[color].split(' ')[1]}`}>{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onUpdateStatus, statusOptions, updating }) => {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [selectedStatus, setSelectedStatus] = useState(order.orderStatus);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleUpdateStatus = () => {
    if (selectedStatus !== order.orderStatus) {
      onUpdateStatus(order._id, selectedStatus, trackingNumber);
    }
  };

  const handleApprove = () => {
    onUpdateStatus(order._id, 'confirmed', trackingNumber);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    onUpdateStatus(order._id, 'cancelled', trackingNumber, rejectReason);
    setShowRejectModal(false);
  };

  const handleRefund = () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for refund');
      return;
    }
    // إضافة refund status
    onUpdateStatus(order._id, 'refunded', trackingNumber, refundReason);
    setShowRefundModal(false);
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      onUpdateStatus(order._id, 'cancelled', trackingNumber, 'Order cancelled by admin');
    }
  };

  const getStatusActions = () => {
    const status = order.orderStatus;
    
    if (status === 'pending') {
      return (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <button
            onClick={handleApprove}
            disabled={updating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FaCheck /> Approve Order
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={updating}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FaTimes /> Reject Order
          </button>
          <button
            onClick={handleCancel}
            disabled={updating}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
          >
            Cancel Order
          </button>
        </div>
      );
    }
    
    if (status === 'confirmed' || status === 'processing') {
      return (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <button
            onClick={() => setSelectedStatus('shipped')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            <FaTruck /> Mark as Shipped
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2"
          >
            Cancel Order
          </button>
        </div>
      );
    }
    
    if (status === 'delivered') {
      return (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <button
            onClick={() => setShowRefundModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 flex items-center gap-2"
          >
            <FaMoneyBillWave /> Request Refund
          </button>
        </div>
      );
    }
    
    return null;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100';
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Order Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-mono font-semibold">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p>{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="capitalize">{order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="pb-4 border-b">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><FaUser className="text-blue-600" /> Customer Information</h3>
              <p className="font-medium">{order.customerId?.name}</p>
              <p className="text-gray-600">{order.customerId?.phone}</p>
              {order.customerId?.email && <p className="text-gray-600">{order.customerId.email}</p>}
            </div>

            {/* Shipping Address */}
            <div className="pb-4 border-b">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><FaMapMarkerAlt className="text-blue-600" /> Shipping Address</h3>
              <p>{order.shippingAddress?.street || 'N/A'}</p>
              <p>{order.shippingAddress?.district}, {order.shippingAddress?.city}</p>
              <p>Phone: {order.shippingAddress?.phone}</p>
              {order.shippingAddress?.notes && <p className="text-gray-500 mt-1">Notes: {order.shippingAddress.notes}</p>}
            </div>

            {/* Update Status - Quick Actions */}
            <div className="pb-4 border-b">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              {getStatusActions()}
            </div>

            {/* Manual Status Update */}
            <div className="pb-4 border-b">
              <h3 className="font-semibold mb-2">Manual Status Update</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value)}
                    className={`px-3 py-1 rounded-lg text-sm transition ${
                      selectedStatus === option.value
                        ? `${option.color} text-white`
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option.action}
                  </button>
                ))}
              </div>
              
              {selectedStatus === 'shipped' && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
              
              {selectedStatus !== order.orderStatus && (
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : `Apply ${statusOptions.find(o => o.value === selectedStatus)?.action}`}
                </button>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><FaBox className="text-blue-600" /> Order Items</h3>
              <div className="space-y-2">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} x {item.unitPrice.toLocaleString()} EGP</p>
                    </div>
                    <p className="font-semibold">{item.subtotal.toLocaleString()} EGP</p>
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
                  <span>{order.shippingCost === 0 ? 'Free' : `${order.shippingCost.toLocaleString()} EGP`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">{order.totalAmount?.toLocaleString()} EGP</span>
                </div>
              </div>
            </div>

            {/* Tracking History */}
            {order.trackingHistory?.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><FaTruck className="text-blue-600" /> Tracking History</h3>
                <div className="space-y-3">
                  {order.trackingHistory.map((event, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <span className="text-gray-500 w-32">{new Date(event.timestamp).toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(event.status)}`}>{event.status}</span>
                      <span className="text-gray-600">{event.location}</span>
                      {event.note && <span className="text-gray-400 text-xs">({event.note})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Reject Order</h2>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this order:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              rows="3"
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3">
              <button onClick={handleReject} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                Confirm Reject
              </button>
              <button onClick={() => setShowRejectModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Request Refund</h2>
            <p className="text-gray-600 mb-4">Please provide a reason for refunding this order:</p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              rows="3"
              placeholder="Reason for refund..."
            />
            <div className="flex gap-3">
              <button onClick={handleRefund} className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
                Request Refund
              </button>
              <button onClick={() => setShowRefundModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default AdminOrders;