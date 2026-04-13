import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaChartLine, FaDollarSign, FaBox, FaShoppingCart, 
  FaArrowUp, FaArrowDown, FaEye, FaEdit, FaSave,
  FaTimes, FaSpinner, FaExclamationTriangle, FaCheckCircle,
    FaWallet
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const SellerProfitAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCost, setEditingCost] = useState(null);
  const [costValue, setCostValue] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/seller/profit-stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load profit analytics');
    } finally {
      setLoading(false);
    }
  };

  const updateCostPrice = async (productId) => {
    if (!costValue || parseFloat(costValue) < 0) {
      toast.error('Please enter a valid cost price');
      return;
    }
    
    try {
      await axios.put(`${API_URL}/seller/products/${productId}/cost`, {
        costPrice: parseFloat(costValue)
      });
      toast.success('Cost price updated successfully');
      setEditingCost(null);
      fetchStats();
    } catch (error) {
      toast.error('Failed to update cost price');
    }
  };

  const formatCurrency = (value) => {
    return `${(value || 0).toLocaleString()} EGP`;
  };

  const getProfitColor = (profit) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitMarginColor = (margin) => {
    if (margin > 20) return 'text-green-600';
    if (margin > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // بيانات للرسم البياني
  const pieData = [
    { name: 'Total Revenue', value: stats.summary.totalRevenue, color: '#3b82f6' },
    { name: 'Total Cost', value: stats.summary.totalCost, color: '#ef4444' },
    { name: 'Total Profit', value: stats.summary.totalProfit, color: '#10b981' }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Profit Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track your earnings, costs, and profitability</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.summary.totalRevenue)}</p>
            </div>
            <FaDollarSign className="text-blue-500 text-3xl opacity-70" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Cost</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.summary.totalCost)}</p>
            </div>
            <FaBox className="text-red-500 text-3xl opacity-70" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Profit</p>
              <p className={`text-2xl font-bold ${getProfitColor(stats.summary.totalProfit)}`}>
                {formatCurrency(stats.summary.totalProfit)}
              </p>
            </div>
            <FaWallet className="text-green-500 text-3xl opacity-70" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Profit Margin</p>
              <p className={`text-2xl font-bold ${getProfitMarginColor(parseFloat(stats.summary.avgProfitMargin))}`}>
                {stats.summary.avgProfitMargin}%
              </p>
            </div>
            <FaChartLine className="text-purple-500 text-3xl opacity-70" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3">Revenue vs Cost vs Profit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Stats */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Products Sold</span>
              <span className="font-bold text-lg">{stats.summary.totalProductsSold}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Active Products</span>
              <span className="font-bold text-lg">{stats.summary.activeProducts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Profit per Sale</span>
              <span className="font-bold text-green-600">
                {stats.summary.totalProductsSold > 0 
                  ? formatCurrency(stats.summary.totalProfit / stats.summary.totalProductsSold)
                  : '0 EGP'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {(stats.lowStock.length > 0 || stats.lossMaking.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {stats.lowStock.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-800">
                <FaExclamationTriangle /> Low Stock Warning
              </h3>
              <div className="space-y-2">
                {stats.lowStock.slice(0, 5).map(product => (
                  <div key={product.productId} className="flex justify-between items-center text-sm">
                    <span>{product.name}</span>
                    <span className="font-semibold text-red-600">{product.remainingStock} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {stats.lossMaking.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-800">
                <FaArrowDown /> Products Selling at Loss
              </h3>
              <div className="space-y-2">
                {stats.lossMaking.slice(0, 5).map(product => (
                  <div key={product.productId} className="flex justify-between items-center text-sm">
                    <span>{product.name}</span>
                    <span className="font-semibold text-red-600">
                      Loss: {formatCurrency(product.price - product.costPrice)}/item
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold">Products Profitability</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Sold</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Price</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Cost</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Revenue</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Profit</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Margin</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.products.map(product => (
                <tr key={product.productId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded object-cover" />
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                   </td>
                  <td className="px-4 py-3 text-right">{product.soldCount}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3 text-right">
                    {editingCost === product.productId ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={costValue}
                          onChange={(e) => setCostValue(e.target.value)}
                          className="w-24 px-2 py-1 border rounded text-right"
                          placeholder="Cost"
                        />
                        <button onClick={() => updateCostPrice(product.productId)} className="text-green-600 hover:text-green-800">
                          <FaSave size={14} />
                        </button>
                        <button onClick={() => setEditingCost(null)} className="text-red-600 hover:text-red-800">
                          <FaTimes size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span>{formatCurrency(product.costPrice)}</span>
                        <button onClick={() => { setEditingCost(product.productId); setCostValue(product.costPrice); }} className="text-gray-400 hover:text-blue-600">
                          <FaEdit size={12} />
                        </button>
                      </div>
                    )}
                   </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(product.totalRevenue)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${getProfitColor(product.totalProfit)}`}>
                    {formatCurrency(product.totalProfit)}
                   </td>
                  <td className={`px-4 py-3 text-right font-semibold ${getProfitMarginColor(parseFloat(product.profitMargin))}`}>
                    {product.profitMargin}%
                   </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => { setSelectedProduct(product); setShowProductModal(true); }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEye />
                    </button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Profitable Products */}
      {stats.topProfitable.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FaArrowUp className="text-green-500" /> Top 5 Most Profitable Products
          </h3>
          <div className="space-y-3">
            {stats.topProfitable.map(product => (
              <div key={product.productId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">Sold: {product.soldCount} units</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(product.totalProfit)}</p>
                  <p className="text-xs text-gray-500">Margin: {product.profitMargin}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Product Details</h2>
              <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            
            {selectedProduct.imageUrl && (
              <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-48 object-cover rounded-lg mb-4" />
            )}
            
            <h3 className="font-bold text-lg mb-2">{selectedProduct.name}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Price</span>
                <span className="font-bold">{formatCurrency(selectedProduct.price)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Cost Price</span>
                <span>{formatCurrency(selectedProduct.costPrice)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Profit per Unit</span>
                <span className={getProfitColor(selectedProduct.price - selectedProduct.costPrice)}>
                  {formatCurrency(selectedProduct.price - selectedProduct.costPrice)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Units Sold</span>
                <span>{selectedProduct.soldCount}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Remaining Stock</span>
                <span>{selectedProduct.remainingStock}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Total Revenue</span>
                <span>{formatCurrency(selectedProduct.totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Total Cost</span>
                <span>{formatCurrency(selectedProduct.totalCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b font-bold">
                <span>Total Profit</span>
                <span className={getProfitColor(selectedProduct.totalProfit)}>
                  {formatCurrency(selectedProduct.totalProfit)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Profit Margin</span>
                <span className={getProfitMarginColor(parseFloat(selectedProduct.profitMargin))}>
                  {selectedProduct.profitMargin}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProfitAnalytics;