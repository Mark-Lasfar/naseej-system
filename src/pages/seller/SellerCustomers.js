import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaShoppingBag, FaCalendarAlt, FaSearch, FaDownload } from 'react-icons/fa';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const SellerCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_URL}/seller/customers`);
            setCustomers(response.data);
        } catch (error) {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerOrders = async (customerId) => {
        try {
            const response = await axios.get(`${API_URL}/seller/customers/${customerId}/orders`);
            setCustomerOrders(response.data);
        } catch (error) {
            toast.error('Failed to load customer orders');
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">👥 My Customers</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and track your customer base</p>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
                    <FaDownload /> Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Customers</p>
                            <p className="text-2xl font-bold">{customers.length}</p>
                        </div>
                        <FaUser className="text-blue-500 text-3xl opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Orders</p>
                            <p className="text-2xl font-bold">{customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}</p>
                        </div>
                        <FaShoppingBag className="text-green-500 text-3xl opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Average Order Value</p>
                            <p className="text-2xl font-bold">
                                {Math.round(customers.reduce((sum, c) => sum + (c.averageOrderValue || 0), 0) / (customers.length || 1)).toLocaleString()} EGP
                            </p>
                        </div>
                        <FaShoppingBag className="text-purple-500 text-3xl opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Lifetime Value</p>
                            <p className="text-2xl font-bold">
                                {customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString()} EGP
                            </p>
                        </div>
                        <FaCalendarAlt className="text-orange-500 text-3xl opacity-50" />
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map(customer => (
                    <div key={customer._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                        <div className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                                    {customer.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{customer.name}</h3>
                                    <p className="text-xs text-gray-500">Customer since {moment(customer.createdAt).format('MMM YYYY')}</p>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                {customer.email && (
                                    <p className="text-sm flex items-center gap-2">
                                        <FaEnvelope className="text-gray-400" /> {customer.email}
                                    </p>
                                )}
                                {customer.phone && (
                                    <p className="text-sm flex items-center gap-2">
                                        <FaPhone className="text-gray-400" /> {customer.phone}
                                    </p>
                                )}
                                {customer.address && (
                                    <p className="text-sm flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-gray-400" /> {customer.address}
                                    </p>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                                <span>🛒 {customer.totalOrders || 0} orders</span>
                                <span>💰 {(customer.totalSpent || 0).toLocaleString()} EGP</span>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedCustomer(customer);
                                        fetchCustomerOrders(customer._id);
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-1 rounded-lg text-sm hover:bg-blue-700"
                                >
                                    View Details
                                </button>
                                <button className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50">
                                    Message
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Customer Details</h2>
                            <button onClick={() => setSelectedCustomer(null)} className="text-gray-500 hover:text-gray-700">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Customer Info */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                    {selectedCustomer.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                                    <p className="text-gray-500">{selectedCustomer.email}</p>
                                    <p className="text-gray-500">{selectedCustomer.phone}</p>
                                </div>
                            </div>

                            {/* Order History */}
                            <h3 className="font-semibold mb-3">Order History</h3>
                            {customerOrders.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No orders yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {customerOrders.map(order => (
                                        <div key={order._id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">Order #{order.orderNumber}</p>
                                                    <p className="text-xs text-gray-500">{moment(order.createdAt).format('MMMM Do YYYY, h:mm a')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-blue-600">{order.totalAmount.toLocaleString()} EGP</p>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {order.orderStatus}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                                {order.items.length} item(s)
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerCustomers;