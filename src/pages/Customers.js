import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaPlus, FaUserPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaHistory, FaShoppingBag } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers`);
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.address?.toLowerCase().includes(term)
      );
      setFilteredCustomers(filtered);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await axios.put(`${API_URL}/customers/${editingCustomer._id}`, formData);
        toast.success('Customer updated successfully.');
      } else {
        await axios.post(`${API_URL}/customers`, formData);
        toast.success('Customer added successfully.');
      }
      fetchCustomers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer? This will also delete all their orders and invoices.')) {
      try {
        await axios.delete(`${API_URL}/customers/${id}`);
        toast.success('Customer deleted successfully.');
        fetchCustomers();
      } catch (error) {
        toast.error('Failed to delete customer.');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', email: '' });
    setEditingCustomer(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      email: customer.email || ''
    });
    setShowModal(true);
  };

  const openDetailsModal = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Address', 'Registered Date', 'Total Orders', 'Total Spent'];
    const rows = customers.map(customer => [
      customer.name,
      customer.phone,
      customer.email || 'N/A',
      customer.address || 'N/A',
      new Date(customer.registeredAt).toLocaleDateString(),
      customer.totalOrders || 0,
      customer.totalSpent || 0
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const getRandomColor = (name) => {
    const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600', 'bg-pink-100 text-pink-600', 'bg-indigo-100 text-indigo-600'];
    const index = name.length % colors.length;
    return colors[index];
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
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700">
            <FaDownload /> Export CSV
          </button>
          <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <FaUserPlus /> Add Customer
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
          <p className="text-xs text-gray-500">Total Customers</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{customers.filter(c => c.totalOrders > 0).length}</p>
          <p className="text-xs text-gray-500">Active Customers</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {new Date().toLocaleDateString('en-US', { month: 'short' })}
          </p>
          <p className="text-xs text-gray-500">This Month</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {customers.filter(c => new Date(c.registeredAt).getMonth() === new Date().getMonth()).length}
          </p>
          <p className="text-xs text-gray-500">New This Month</p>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition group">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${getRandomColor(customer.name)}`}>
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{customer.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FaCalendarAlt size={12} />
                      Joined {new Date(customer.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition">
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(customer)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(customer._id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 border-t pt-4">
                <p className="flex items-center gap-2 text-sm">
                  <FaPhone className="text-gray-400" size={14} />
                  <span className="text-gray-700">{customer.phone}</span>
                </p>
                {customer.email && (
                  <p className="flex items-center gap-2 text-sm">
                    <FaEnvelope className="text-gray-400" size={14} />
                    <span className="text-gray-700">{customer.email}</span>
                  </p>
                )}
                {customer.address && (
                  <p className="flex items-center gap-2 text-sm">
                    <FaMapMarkerAlt className="text-gray-400" size={14} />
                    <span className="text-gray-700 line-clamp-1">{customer.address}</span>
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaShoppingBag />
                  <span>{customer.totalOrders || 0} orders</span>
                </div>
                <button
                  onClick={() => openDetailsModal(customer)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <FaHistory size={12} /> View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          {searchTerm ? (
            <>
              <p className="text-gray-500">No customers found matching "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="mt-2 text-blue-600 hover:text-blue-800">
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500">No customers yet. Add your first customer!</p>
              <button onClick={openAddModal} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2">
                <FaPlus /> Add Customer
              </button>
            </>
          )}
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Customer Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>

            <div className="flex items-center gap-4 mb-6 pb-4 border-b">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getRandomColor(selectedCustomer.name)}`}>
                {getInitials(selectedCustomer.name)}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                <p className="text-gray-500">Customer since {new Date(selectedCustomer.registeredAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p className="flex items-center gap-2"><FaPhone className="text-gray-400" /> {selectedCustomer.phone}</p>
                  {selectedCustomer.email && <p className="flex items-center gap-2"><FaEnvelope className="text-gray-400" /> {selectedCustomer.email}</p>}
                  {selectedCustomer.address && <p className="flex items-center gap-2"><FaMapMarkerAlt className="text-gray-400" /> {selectedCustomer.address}</p>}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders || 0}</p>
                    <p className="text-xs text-gray-500">Total Orders</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedCustomer.totalSpent?.toLocaleString() || 0} EGP</p>
                    <p className="text-xs text-gray-500">Total Spent</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Recent Orders</h4>
                {selectedCustomer.recentOrders?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.recentOrders.map((order, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b pb-2">
                        <span className="font-mono">{order.orderNumber}</span>
                        <span>{order.totalAmount?.toLocaleString()} EGP</span>
                        <span className="text-gray-500">{new Date(order.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No orders yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => { setShowDetailsModal(false); openEditModal(selectedCustomer); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Edit Customer
              </button>
              <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;