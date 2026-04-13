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

  // ✅ روابط الإجراءات (Actions Cards)
  const actionCards = [
    { 
      to: "/seller/products", 
      icon: <FaBox className="text-blue-500 text-3xl mb-3" />, 
      title: "Manage Products", 
      description: "Add, edit, or remove products from your store",
      color: "blue"
    },
    { 
      to: "/seller/orders", 
      icon: <FaShoppingBag className="text-green-500 text-3xl mb-3" />, 
      title: "Manage Orders", 
      description: "View and process customer orders",
      color: "green"
    },
    { 
      to: "/seller/payouts", 
      icon: <FaMoneyBillWave className="text-yellow-500 text-3xl mb-3" />, 
      title: "Payout Settings", 
      description: "Manage your payment methods and withdrawals",
      color: "yellow"
    },
    { 
      to: "/seller/store-settings", 
      icon: <FaStore className="text-purple-500 text-3xl mb-3" />, 
      title: "Store Settings", 
      description: "Customize your store information",
      color: "purple"
    },
    { 
      to: "/seller/profit-analytics", 
      icon: <FaChartLine className="text-indigo-500 text-3xl mb-3" />, 
      title: "Profit Analytics", 
      description: "Track your earnings, costs, and profitability",
      color: "indigo"
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm p-4 md:p-6 flex justify-between items-center hover:shadow-md transition">
            <div>
              <p className="text-gray-500 text-xs md:text-sm">{card.title}</p>
              <p className="text-xl md:text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`${card.bg} p-2 md:p-3 rounded-full`}>{card.icon}</div>
          </div>
        ))}
      </div>
      
      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {actionCards.map((card, idx) => (
          <Link 
            key={idx}
            to={card.to} 
            className="group bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0">
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base md:text-lg group-hover:text-blue-600 transition">
                  {card.title}
                </h3>
                <p className="text-gray-500 text-xs md:text-sm mt-1">
                  {card.description}
                </p>
              </div>
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SellerDashboard;