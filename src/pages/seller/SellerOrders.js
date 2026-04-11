import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaEye, FaTruck, FaCheck, FaTimes } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/seller/orders`);
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally { setLoading(false); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_URL}/seller/orders/${orderId}/status`, { status });
      toast.success(`Order ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Store Orders</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3">Order #</th><th className="px-6 py-3">Customer</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Total</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr></thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} className="border-t">
                <td className="px-6 py-4 font-mono">{order.orderNumber}</td>
                <td className="px-6 py-4">{order.customerId?.name}</td>
                <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">{order.totalAmount?.toLocaleString()} EGP</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' : order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.orderStatus}</span></td>
                <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => setSelectedOrder(order)} className="text-blue-600"><FaEye /></button><button onClick={() => updateStatus(order._id, 'processing')} className="text-purple-600"><FaTruck /></button><button onClick={() => updateStatus(order._id, 'delivered')} className="text-green-600"><FaCheck /></button><button onClick={() => updateStatus(order._id, 'cancelled')} className="text-red-600"><FaTimes /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerOrders;