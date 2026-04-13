import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaIndustry, FaCheckCircle, FaTruck, FaClock, 
  FaMapMarkerAlt, FaEnvelope, FaPhone, FaDollarSign,
  FaSpinner, FaExternalLinkAlt, FaStore, FaBox,
  FaCalendarAlt, FaMoneyBillWave, FaChartLine,
  FaArrowLeft, FaEye, FaPlus, FaEdit, FaTrash,
  FaTimes, FaCog, FaLink, FaKey, FaShieldAlt,
  FaCode, FaSyncAlt, FaPrint, FaDownload
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ProductionPartner = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productionOrders, setProductionOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('factories');
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedFactory, setSelectedFactory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showFactoryModal, setShowFactoryModal] = useState(false);
  const [editingFactory, setEditingFactory] = useState(null);
  const [showGcodeModal, setShowGcodeModal] = useState(false);
  const [selectedOrderGcode, setSelectedOrderGcode] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingData, setTrackingData] = useState({ trackingNumber: '', shippingCompany: '', notes: '' });
  const [factoryForm, setFactoryForm] = useState({
    name: '',
    partnerId: '',
    capabilities: { maxWidth: 400, maxHeight: 400, materials: [], patterns: [] },
    pricing: { basePricePerSqm: 100 },
    contactInfo: { email: '', phone: '', address: '' },
    apiEndpoint: '',
    webhookUrl: '',
    webhookSecret: ''
  });
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [selectedFactoryKeys, setSelectedFactoryKeys] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchFactories();
    fetchProductionOrders();
    fetchDesigns();
  }, []);

  const fetchFactories = async () => {
    try {
      const url = isAdmin ? `${API_URL}/admin/factories` : `${API_URL}/partners/factories`;
      const response = await axios.get(url);
      setFactories(response.data);
    } catch (error) {
      console.error('Failed to load factories:', error);
      toast.error('Failed to load factories');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductionOrders = async () => {
    try {
      let url;
      if (isAdmin) {
        url = `${API_URL}/admin/production-orders`;
      } else {
        url = `${API_URL}/partners/my-orders`;
      }
      const response = await axios.get(url);
      setProductionOrders(response.data.orders || response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setProductionOrders([]);
    }
  };

  const fetchDesigns = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_URL}/designs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDesigns(response.data.designs || []);
    } catch (error) {
      console.error('Failed to fetch designs:', error);
      setDesigns([]);
    }
  };

  const handleCreateFactory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/admin/factories`, factoryForm);
      toast.success('Factory created successfully');
      setShowFactoryModal(false);
      resetFactoryForm();
      fetchFactories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create factory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFactory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${API_URL}/admin/factories/${editingFactory._id}`, factoryForm);
      toast.success('Factory updated successfully');
      setShowFactoryModal(false);
      resetFactoryForm();
      fetchFactories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update factory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFactory = async (factoryId) => {
    if (!window.confirm('Are you sure you want to delete this factory?')) return;
    try {
      await axios.delete(`${API_URL}/admin/factories/${factoryId}`);
      toast.success('Factory deleted');
      fetchFactories();
    } catch (error) {
      toast.error('Failed to delete factory');
    }
  };

  const handleRegenerateApiKeys = async (factoryId) => {
    if (!window.confirm('Regenerating API keys will invalidate the old ones. Continue?')) return;
    try {
      const response = await axios.post(`${API_URL}/admin/factories/${factoryId}/regenerate-keys`);
      toast.success('API keys regenerated successfully');
      if (selectedFactoryKeys && selectedFactoryKeys._id === factoryId) {
        setSelectedFactoryKeys(response.data);
      }
      fetchFactories();
    } catch (error) {
      toast.error('Failed to regenerate API keys');
    }
  };

  const handleViewApiKeys = (factory) => {
    setSelectedFactoryKeys(factory);
    setShowApiKeys(true);
  };

  const submitProductionOrder = async () => {
    if (!selectedDesign || !selectedFactory) {
      toast.error('Please select a design and a factory');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/partners/production-orders`, {
        designId: selectedDesign._id,
        partnerId: selectedFactory
      });
      toast.success('Production order submitted successfully!');
      fetchProductionOrders();
      setShowOrderModal(false);
      setSelectedDesign(null);
      setSelectedFactory('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  const updateOrderStatus = async (orderId, status, trackingNumber = '', shippingCompany = '', notes = '') => {
    try {
      await axios.put(`${API_URL}/admin/production-orders/${orderId}/status`, {
        status,
        trackingNumber,
        shippingCompany,
        notes
      });
      toast.success(`Order status updated to ${status}`);
      fetchProductionOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const viewGcode = async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/factory/orders/${orderId}/gcode`, {
        headers: {
          'X-API-Key': selectedFactoryKeys?.apiKey || '',
          'X-API-Secret': selectedFactoryKeys?.apiSecret || ''
        }
      });
      setSelectedOrderGcode(response.data);
      setShowGcodeModal(true);
    } catch (error) {
      toast.error('Failed to fetch G-code');
    }
  };

  const downloadGcode = (gcode, filename) => {
    const blob = new Blob([gcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.gcode`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('G-code downloaded');
  };

  const printGcode = (gcode) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>G-Code Preview</title></head>
        <body style="font-family: monospace; white-space: pre-wrap; padding: 20px;">
          <pre>${gcode}</pre>
          <script>window.print();<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const resetFactoryForm = () => {
    setFactoryForm({
      name: '',
      partnerId: '',
      capabilities: { maxWidth: 400, maxHeight: 400, materials: [], patterns: [] },
      pricing: { basePricePerSqm: 100 },
      contactInfo: { email: '', phone: '', address: '' },
      apiEndpoint: '',
      webhookUrl: '',
      webhookSecret: ''
    });
    setEditingFactory(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      case 'shipped': return <FaTruck className="text-indigo-500" />;
      case 'in_progress': return <FaSpinner className="animate-spin text-purple-500" />;
      default: return <FaClock className="text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-600 hover:text-gray-800 transition">
            <FaArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🏭 Production Partner Network
            </h1>
            <p className="text-gray-500 text-sm mt-1">Connect with certified factories to bring your designs to life</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetFactoryForm(); setShowFactoryModal(true); }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition"
          >
            <FaPlus /> Add Factory
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('factories')}
          className={`pb-3 px-4 font-medium transition ${activeTab === 'factories' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <FaIndustry className="inline mr-2" /> Available Factories ({factories.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 font-medium transition ${activeTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <FaTruck className="inline mr-2" /> My Production Orders ({productionOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('designs')}
          className={`pb-3 px-4 font-medium transition ${activeTab === 'designs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <FaBox className="inline mr-2" /> My Designs ({designs.length})
        </button>
      </div>

      {/* Factories Tab */}
      {activeTab === 'factories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factories.map((factory) => (
            <div key={factory._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center relative">
                <FaIndustry className="text-white text-5xl opacity-50" />
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => { setEditingFactory(factory); setFactoryForm(factory); setShowFactoryModal(true); }}
                      className="p-1 bg-white/20 rounded-lg hover:bg-white/30 text-white"
                      title="Edit Factory"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteFactory(factory._id)}
                      className="p-1 bg-white/20 rounded-lg hover:bg-red-500/50 text-white"
                      title="Delete Factory"
                    >
                      <FaTrash size={14} />
                    </button>
                    <button
                      onClick={() => handleViewApiKeys(factory)}
                      className="p-1 bg-white/20 rounded-lg hover:bg-white/30 text-white"
                      title="View API Keys"
                    >
                      <FaKey size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold mb-2">{factory.name}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {factory.contactInfo?.address && (
                    <p className="flex items-center gap-2"><FaMapMarkerAlt /> {factory.contactInfo.address}</p>
                  )}
                  {factory.contactInfo?.email && (
                    <p className="flex items-center gap-2"><FaEnvelope /> {factory.contactInfo.email}</p>
                  )}
                  {factory.contactInfo?.phone && (
                    <p className="flex items-center gap-2"><FaPhone /> {factory.contactInfo.phone}</p>
                  )}
                  {factory.capabilities?.maxWidth && (
                    <p>📏 Max Size: {factory.capabilities.maxWidth}x{factory.capabilities.maxHeight} cm</p>
                  )}
                  <p className="flex items-center gap-2">
                    <FaDollarSign /> Base Price: {factory.pricing?.basePricePerSqm} EGP/m²
                  </p>
                  {factory.webhookUrl && (
                    <p className="flex items-center gap-2 text-xs text-gray-400 truncate">
                      <FaLink /> {factory.webhookUrl}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedDesign(null);
                    setSelectedFactory(factory.partnerId);
                    setShowOrderModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition"
                >
                  Send to Factory
                </button>
              </div>
            </div>
          ))}
          {factories.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center">
              <FaIndustry size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Factories Available</h3>
              <p className="text-gray-500">Check back later for production partners</p>
            </div>
          )}
        </div>
      )}

      {/* Production Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {productionOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <FaIndustry size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Production Orders Yet</h3>
              <p className="text-gray-500">Design a carpet and send it to a factory to get started</p>
              <Link to="/design-studio" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">
                Go to Design Studio
              </Link>
            </div>
          ) : (
            productionOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Order #{order._id?.slice(-8)}</p>
                    <p className="font-semibold mt-1">{order.designId?.name || 'Custom Design'}</p>
                    {order.designId?.dimensions && (
                      <p className="text-sm text-gray-500">{order.designId.dimensions.width}x{order.designId.dimensions.height} cm</p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusBadge(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Estimated Completion</p>
                    <p className="font-medium">{order.estimatedCompletion ? new Date(order.estimatedCompletion).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cost</p>
                    <p className="font-medium text-blue-600">{order.cost?.toLocaleString()} EGP</p>
                  </div>
                  {order.trackingNumber && (
                    <div>
                      <p className="text-gray-500">Tracking Number</p>
                      <p className="font-mono text-sm">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
                
                {/* Tracking History */}
                {order.trackingHistory && order.trackingHistory.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Tracking History</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {order.trackingHistory.map((history, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">{new Date(history.timestamp).toLocaleString()}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(history.status)}`}>
                            {history.status}
                          </span>
                          <span className="text-gray-500">{history.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                  {isAdmin && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <>
                      <select
                        onChange={(e) => updateOrderStatus(order._id, e.target.value, order.trackingNumber, order.shippingCompany)}
                        className="px-3 py-1 border rounded-lg text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>Update Status</option>
                        <option value="approved">✅ Approve</option>
                        <option value="in_progress">🔧 Start Production</option>
                        <option value="completed">🏁 Complete</option>
                        <option value="shipped">📦 Mark as Shipped</option>
                        <option value="cancelled">❌ Cancel</option>
                      </select>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setTrackingData({
                            trackingNumber: order.trackingNumber || '',
                            shippingCompany: order.shippingCompany || '',
                            notes: ''
                          });
                          setShowTrackingModal(true);
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                      >
                        <FaTruck className="inline mr-1" size={12} /> Add Tracking
                      </button>
                    </>
                  )}
                  {order.status === 'shipped' && order.trackingNumber && (
                    <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                      Track Order <FaExternalLinkAlt size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => viewGcode(order._id)}
                    className="text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
                  >
                    <FaCode /> View G-Code
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Designs Tab */}
      {activeTab === 'designs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center">
              <FaBox size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Designs Yet</h3>
              <p className="text-gray-500">Create a design in the AI Design Studio first</p>
              <Link to="/design-studio" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">
                Go to Design Studio
              </Link>
            </div>
          ) : (
            designs.map((design) => (
              <div key={design._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {design.previewUrl ? (
                    <img src={design.previewUrl} alt={design.name} className="w-full h-full object-cover" />
                  ) : (
                    <FaBox size={48} className="text-gray-300" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{design.name}</h3>
                  <p className="text-sm text-gray-500">{design.dimensions?.width}x{design.dimensions?.height} cm</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-blue-600 font-bold">{design.costEstimate?.total?.toLocaleString()} EGP</span>
                    <button
                      onClick={() => {
                        setSelectedDesign(design);
                        setShowOrderModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                    >
                      Send to Factory
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Send to Production</h2>
              <button onClick={() => { setShowOrderModal(false); setSelectedDesign(null); }} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            
            {selectedDesign && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedDesign.name}</p>
                <p className="text-sm text-gray-500">{selectedDesign.dimensions?.width}x{selectedDesign.dimensions?.height} cm</p>
                <p className="text-sm text-blue-600 mt-1">{selectedDesign.costEstimate?.total?.toLocaleString()} EGP</p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Factory</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
              >
                <option value="">Choose a factory...</option>
                {factories.map(factory => (
                  <option key={factory._id} value={factory.partnerId}>
                    {factory.name} - {factory.pricing?.basePricePerSqm} EGP/m²
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={submitProductionOrder}
                disabled={submitting || !selectedFactory}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Order'}
              </button>
              <button
                onClick={() => { setShowOrderModal(false); setSelectedDesign(null); }}
                className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Tracking Information</h2>
              <button onClick={() => { setShowTrackingModal(false); setSelectedOrder(null); }} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingData.trackingNumber}
                  onChange={(e) => setTrackingData({ ...trackingData, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tracking number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shipping Company</label>
                <input
                  type="text"
                  value={trackingData.shippingCompany}
                  onChange={(e) => setTrackingData({ ...trackingData, shippingCompany: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., DHL, FedEx, UPS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={trackingData.notes}
                  onChange={(e) => setTrackingData({ ...trackingData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  updateOrderStatus(selectedOrder._id, selectedOrder.status, trackingData.trackingNumber, trackingData.shippingCompany, trackingData.notes);
                  setShowTrackingModal(false);
                  setSelectedOrder(null);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Save Tracking
              </button>
              <button
                onClick={() => { setShowTrackingModal(false); setSelectedOrder(null); }}
                className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* G-Code Modal */}
      {showGcodeModal && selectedOrderGcode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaCode /> G-Code Preview
              </h2>
              <button onClick={() => { setShowGcodeModal(false); setSelectedOrderGcode(null); }} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap break-words">
                {selectedOrderGcode.gcode}
              </pre>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => downloadGcode(selectedOrderGcode.gcode, `design_${selectedOrderGcode.designId}`)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <FaDownload /> Download G-Code
              </button>
              <button
                onClick={() => printGcode(selectedOrderGcode.gcode)}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <FaPrint /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Modal (Admin only) */}
      {showApiKeys && selectedFactoryKeys && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">API Credentials</h2>
              <button onClick={() => { setShowApiKeys(false); setSelectedFactoryKeys(null); }} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Factory Name</label>
                <p className="text-gray-800 font-medium">{selectedFactoryKeys.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Partner ID</label>
                <code className="block bg-gray-100 p-2 rounded-lg text-sm font-mono break-all">{selectedFactoryKeys.partnerId}</code>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <code className="block bg-gray-100 p-2 rounded-lg text-sm font-mono break-all">{selectedFactoryKeys.apiKey}</code>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Secret</label>
                <code className="block bg-gray-100 p-2 rounded-lg text-sm font-mono break-all">{selectedFactoryKeys.apiSecret}</code>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <FaShieldAlt /> Keep these credentials secure. Share them only with the factory.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleRegenerateApiKeys(selectedFactoryKeys._id)}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
              >
                <FaSyncAlt /> Regenerate Keys
              </button>
              <button
                onClick={() => { setShowApiKeys(false); setSelectedFactoryKeys(null); }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Factory Modal (Admin only) */}
      {showFactoryModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingFactory ? 'Edit Factory' : 'Add New Factory'}</h2>
              <button onClick={() => { setShowFactoryModal(false); resetFactoryForm(); }} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={editingFactory ? handleUpdateFactory : handleCreateFactory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Factory Name *</label>
                <input
                  type="text"
                  value={factoryForm.name}
                  onChange={(e) => setFactoryForm({ ...factoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Partner ID *</label>
                <input
                  type="text"
                  value={factoryForm.partnerId}
                  onChange={(e) => setFactoryForm({ ...factoryForm, partnerId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingFactory}
                />
                <p className="text-xs text-gray-400 mt-1">Unique identifier for this factory (cannot be changed)</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Width (cm)</label>
                  <input
                    type="number"
                    value={factoryForm.capabilities.maxWidth}
                    onChange={(e) => setFactoryForm({
                      ...factoryForm,
                      capabilities: { ...factoryForm.capabilities, maxWidth: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Height (cm)</label>
                  <input
                    type="number"
                    value={factoryForm.capabilities.maxHeight}
                    onChange={(e) => setFactoryForm({
                      ...factoryForm,
                      capabilities: { ...factoryForm.capabilities, maxHeight: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Base Price (EGP/m²)</label>
                <input
                  type="number"
                  value={factoryForm.pricing.basePricePerSqm}
                  onChange={(e) => setFactoryForm({
                    ...factoryForm,
                    pricing: { ...factoryForm.pricing, basePricePerSqm: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Factory API Endpoint URL</label>
                <input
                  type="url"
                  value={factoryForm.apiEndpoint}
                  onChange={(e) => setFactoryForm({ ...factoryForm, apiEndpoint: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://factory.example.com/api/naseej"
                />
                <p className="text-xs text-gray-400 mt-1">The URL where the factory receives webhook notifications</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={factoryForm.webhookUrl}
                  onChange={(e) => setFactoryForm({ ...factoryForm, webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://factory.example.com/webhook"
                />
                <p className="text-xs text-gray-400 mt-1">Receive notifications about production orders</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Webhook Secret (Optional)</label>
                <input
                  type="text"
                  value={factoryForm.webhookSecret}
                  onChange={(e) => setFactoryForm({ ...factoryForm, webhookSecret: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Shared secret for webhook verification"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={factoryForm.contactInfo.email}
                    onChange={(e) => setFactoryForm({
                      ...factoryForm,
                      contactInfo: { ...factoryForm.contactInfo, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={factoryForm.contactInfo.phone}
                    onChange={(e) => setFactoryForm({
                      ...factoryForm,
                      contactInfo: { ...factoryForm.contactInfo, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={factoryForm.contactInfo.address}
                  onChange={(e) => setFactoryForm({
                    ...factoryForm,
                    contactInfo: { ...factoryForm.contactInfo, address: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Saving...' : (editingFactory ? 'Update Factory' : 'Create Factory')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFactoryModal(false); resetFactoryForm(); }}
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPartner;