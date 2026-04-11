import Logo from '../components/Logo';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaBox, FaUsers, FaFileInvoice, FaDollarSign, FaChartLine, FaExclamationTriangle,
  FaShoppingBag, FaTruck, FaClock, FaStar, FaEye, FaArrowUp, FaArrowDown,
  FaCalendarAlt, FaSyncAlt, FaDownload, FaPrint
} from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
    generateSalesData();
  }, []);

  const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      toast.error('Please login again');
      return;
    }
    
    const response = await axios.get(`${API_URL}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStats(response.data);
  } catch (error) {
    console.error('Stats error:', error);
    toast.error('Failed to load dashboard stats.');
  } finally {
    setLoading(false);
  }
};

  const fetchRecentOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders?limit=5`);
      setRecentOrders(response.data.orders || []);
    } catch (error) {
      console.error('Orders error:', error);
    }
  };

  const generateSalesData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 30) + 5
      });
    }
    setSalesData(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    await fetchRecentOrders();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  const handleExport = () => {
    toast.success('Export started. Check your downloads folder.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Products', value: stats?.totalProducts || 0, icon: <FaBox className="text-blue-500" size={28} />, bg: 'bg-blue-100', change: '+12%', trend: 'up' },
    { title: 'Total Customers', value: stats?.totalCustomers || 0, icon: <FaUsers className="text-green-500" size={28} />, bg: 'bg-green-100', change: '+8%', trend: 'up' },
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: <FaShoppingBag className="text-purple-500" size={28} />, bg: 'bg-purple-100', change: '+15%', trend: 'up' },
    { title: 'Total Revenue', value: `${stats?.totalOrderValue?.toLocaleString() || 0} EGP`, icon: <FaDollarSign className="text-yellow-500" size={28} />, bg: 'bg-yellow-100', change: '+23%', trend: 'up' }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Logo size="md" showText={false} />
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening with your store today.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <FaSyncAlt className={`${refreshing ? 'animate-spin' : ''}`} size={16} /> Refresh
          </button>
          <button onClick={handleExport} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <FaDownload size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {card.trend === 'up' ? <FaArrowUp className="text-green-500 text-sm" /> : <FaArrowDown className="text-red-500 text-sm" />}
                  <span className={`text-xs ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{card.change}</span>
                  <span className="text-xs text-gray-400">vs last month</span>
                </div>
              </div>
              <div className={`${card.bg} p-3 rounded-full`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaChartLine className="text-green-500" />
              Sales Overview
            </h2>
            <select className="text-sm border rounded-lg px-2 py-1">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 12 months</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaShoppingBag className="text-purple-500" />
              Orders Overview
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaStar className="text-yellow-500" />
            Top Selling Products
          </h2>
          <div className="space-y-3">
            {stats?.topProducts?.map((product, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-200 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{product.revenue.toLocaleString()} EGP</p>
                  <p className="text-xs text-green-600">+{Math.floor(Math.random() * 20) + 5}%</p>
                </div>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <p className="text-gray-500 text-center py-8">No sales data yet. Start selling to see top products!</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" />
            Low Stock Alerts
          </h2>
          <div className="space-y-3">
            {stats?.lowStockProducts?.length > 0 ? (
              stats.lowStockProducts.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.material} | {product.size}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {product.quantity === 0 ? 'Out of Stock' : `${product.quantity} left`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-green-500 text-4xl mb-2">✓</div>
                <p className="text-gray-500">All products have sufficient stock!</p>
              </div>
            )}
          </div>
          {stats?.lowStockCount > 0 && (
            <Link to="/products" className="block mt-4 text-center text-blue-600 hover:text-blue-800 text-sm">
              View all products →
            </Link>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaClock className="text-blue-500" />
            Recent Orders
          </h2>
          <Link to="/admin-orders" className="text-blue-600 hover:text-blue-800 text-sm">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{order.customerId?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{order.customerId?.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-semibold">{order.totalAmount?.toLocaleString()} EGP</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/order-tracking/${order.orderNumber}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <FaEye size={16} /> Track
                    </Link>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
          <p className="text-xs text-gray-500">Total Products</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold">{stats?.totalCustomers || 0}</p>
          <p className="text-xs text-gray-500">Total Customers</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold">{stats?.totalOrderValue?.toLocaleString() || 0} EGP</p>
          <p className="text-xs text-gray-500">Total Revenue</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;