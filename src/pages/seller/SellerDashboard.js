import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaBox, FaShoppingBag, FaMoneyBillWave, FaStore, FaEye, FaChartLine } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const SellerDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/seller/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Products', value: stats.totalProducts || 0, icon: <FaBox className="text-blue-500" />, bg: 'bg-blue-100' },
    { title: 'Total Sales', value: stats.totalSales || 0, icon: <FaShoppingBag className="text-green-500" />, bg: 'bg-green-100' },
    { title: 'Total Revenue', value: `${stats.totalRevenue?.toLocaleString() || 0} EGP`, icon: <FaMoneyBillWave className="text-yellow-500" />, bg: 'bg-yellow-100' },
    { title: 'Store Views', value: stats.storeViews || 0, icon: <FaEye className="text-purple-500" />, bg: 'bg-purple-100' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm p-6 flex justify-between items-center">
            <div><p className="text-gray-500 text-sm">{card.title}</p><p className="text-2xl font-bold mt-1">{card.value}</p></div>
            <div className={`${card.bg} p-3 rounded-full`}>{card.icon}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link to="/seller/products" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <FaBox className="text-blue-500 text-3xl mb-3" />
          <h3 className="font-semibold text-lg">Manage Products</h3>
          <p className="text-gray-500 text-sm">Add, edit, or remove products from your store</p>
        </Link>
        <Link to="/seller/orders" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <FaShoppingBag className="text-green-500 text-3xl mb-3" />
          <h3 className="font-semibold text-lg">Manage Orders</h3>
          <p className="text-gray-500 text-sm">View and process customer orders</p>
        </Link>
        <Link to="/seller/payouts" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <FaMoneyBillWave className="text-yellow-500 text-3xl mb-3" />
          <h3 className="font-semibold text-lg">Payout Settings</h3>
          <p className="text-gray-500 text-sm">Manage your payment methods and withdrawals</p>
        </Link>
        <Link to="/seller/store-settings" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <FaStore className="text-purple-500 text-3xl mb-3" />
          <h3 className="font-semibold text-lg">Store Settings</h3>
          <p className="text-gray-500 text-sm">Customize your store information</p>
        </Link>
      </div>
    </div>
  );
};

export default SellerDashboard;