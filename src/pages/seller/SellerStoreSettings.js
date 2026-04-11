import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash, FaPaypal, FaBuilding, FaMobileAlt, FaCreditCard, FaStore, FaImage, FaInfoCircle, FaSave } from 'react-icons/fa';

import { useNavigate } from 'react-router-dom';


const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const SellerStoreSettings = () => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();
  const [paymentForm, setPaymentForm] = useState({
    type: 'bank',
    isActive: true,
    bankDetails: { bankName: '', accountName: '', accountNumber: '' },
    paypalDetails: { email: '' },
    mobileWalletDetails: { phoneNumber: '', provider: 'vodafone' }
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    coverImage: '',
    contact: { phone: '', email: '', address: '', city: '' },
    socialLinks: { facebook: '', instagram: '', twitter: '', whatsapp: '' },
    paymentSettings: { minimumPayout: 500, autoReleaseDays: 14 }
  });

  useEffect(() => {
    fetchStore();
    fetchPaymentMethods();
  }, []);

  const fetchStore = async () => {
    try {
      const response = await axios.get(`${API_URL}/seller/store`);
      setStore(response.data);
      setFormData({
        name: response.data.name || '',
        description: response.data.description || '',
        logo: response.data.logo || '',
        coverImage: response.data.coverImage || '',
        contact: response.data.contact || { phone: '', email: '', address: '', city: '' },
        socialLinks: response.data.socialLinks || { facebook: '', instagram: '', twitter: '', whatsapp: '' },
        paymentSettings: response.data.paymentSettings || { minimumPayout: 500, autoReleaseDays: 14 }
      });
    } catch (error) {
      // إذا لم يكن هناك متجر، هذا طبيعي - سنقوم بإنشائه عند الحفظ
      console.log('No store found, will create on save');
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`${API_URL}/payouts/methods`);
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (!formData.name.trim()) {
      toast.error('Store name is required');
      setSaving(false);
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/seller/store`, formData);
      setStore(response.data);
      toast.success(store ? 'Store updated successfully!' : 'Store created successfully!');

      // ✅ إذا تم إنشاء متجر جديد (وليس تحديث)، انتقل إلى صفحة المتجر
      if (!store && response.data.slug) {
        setTimeout(() => {
          navigate(`/shop/${response.data.slug}`);
        }, 1500);
      } else {
        // إذا كان تحديث، قم بإعادة تحميل الصفحة
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.error || 'Failed to save store settings');
    } finally {
      setSaving(false);
    }
  };

  const addPaymentMethod = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/payouts/methods`, paymentForm);
      toast.success('Payment method added');
      fetchPaymentMethods();
      setShowPaymentModal(false);
      resetPaymentForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add payment method');
    }
  };

  const deletePaymentMethod = async (id) => {
    if (window.confirm('Delete this payment method?')) {
      try {
        await axios.delete(`${API_URL}/payouts/methods/${id}`);
        toast.success('Payment method deleted');
        fetchPaymentMethods();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      type: 'bank',
      isActive: true,
      bankDetails: { bankName: '', accountName: '', accountNumber: '' },
      paypalDetails: { email: '' },
      mobileWalletDetails: { phoneNumber: '', provider: 'vodafone' }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaStore className="text-blue-600" />
        {store ? 'Store Settings' : 'Create Your Store'}
      </h1>

      {!store && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            You don't have a store yet. Fill in the information below to create your store.
          </p>
        </div>
      )}

      {/* Basic Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Store Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            placeholder="Enter your store name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="4"
            placeholder="Describe your store and what you sell..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Logo URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.logo}
                onChange={e => setFormData({ ...formData, logo: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
              {formData.logo && (
                <div className="w-12 h-12 border rounded overflow-hidden">
                  <img src={formData.logo} alt="Logo preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cover Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.coverImage}
                onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/cover.jpg"
              />
              {formData.coverImage && (
                <div className="w-12 h-12 border rounded overflow-hidden">
                  <img src={formData.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FaInfoCircle className="text-gray-500" />
            Contact Information
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.contact?.phone || ''}
              onChange={e => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.contact?.email || ''}
              onChange={e => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.contact?.address || ''}
              onChange={e => setFormData({ ...formData, contact: { ...formData.contact, address: e.target.value } })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="City"
              value={formData.contact?.city || ''}
              onChange={e => setFormData({ ...formData, contact: { ...formData.contact, city: e.target.value } })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Social Links</h3>
          <div className="space-y-3">
            <input
              type="url"
              placeholder="Facebook URL"
              value={formData.socialLinks?.facebook || ''}
              onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, facebook: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              placeholder="Instagram URL"
              value={formData.socialLinks?.instagram || ''}
              onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              placeholder="Twitter URL"
              value={formData.socialLinks?.twitter || ''}
              onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="WhatsApp Number"
              value={formData.socialLinks?.whatsapp || ''}
              onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, whatsapp: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Payout Settings</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Minimum Payout (EGP)</label>
              <input
                type="number"
                value={formData.paymentSettings?.minimumPayout || 500}
                onChange={e => setFormData({ ...formData, paymentSettings: { ...formData.paymentSettings, minimumPayout: parseInt(e.target.value) } })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Auto Release Days</label>
              <input
                type="number"
                value={formData.paymentSettings?.autoReleaseDays || 14}
                onChange={e => setFormData({ ...formData, paymentSettings: { ...formData.paymentSettings, autoReleaseDays: parseInt(e.target.value) } })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {store ? 'Saving...' : 'Creating Store...'}
            </>
          ) : (
            <>
              <FaSave />
              {store ? 'Save Changes' : 'Create Store'}
            </>
          )}
        </button>
      </form>

      {/* Only show payment methods section if store exists */}
      {store && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Accepted Payment Methods</h2>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-sm hover:bg-green-700 transition"
            >
              <FaPlus /> Add Method
            </button>
          </div>

          {paymentMethods.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No payment methods added. Customers can only pay with Cash on Delivery.
            </p>
          ) : (
            <div className="space-y-2">
              {paymentMethods.map(method => (
                <div key={method._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {method.type === 'bank' && <FaBuilding className="text-blue-600 text-lg" />}
                    {method.type === 'paypal' && <FaPaypal className="text-blue-600 text-lg" />}
                    {(method.type === 'vodafone_cash' || method.type === 'instapay') && <FaMobileAlt className="text-green-600 text-lg" />}
                    <div>
                      <span className="capitalize font-medium">
                        {method.type === 'bank' ? 'Bank Transfer' :
                          method.type === 'paypal' ? 'PayPal' :
                            method.type === 'vodafone_cash' ? 'Vodafone Cash' :
                              method.type === 'instapay' ? 'InstaPay' : method.type}
                      </span>
                      {method.isDefault && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deletePaymentMethod(method._id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Payment Method</h2>
            <form onSubmit={addPaymentMethod}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={paymentForm.type}
                  onChange={e => setPaymentForm({ ...paymentForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="vodafone_cash">Vodafone Cash</option>
                  <option value="instapay">InstaPay</option>
                </select>
              </div>

              {paymentForm.type === 'bank' && (
                <>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={paymentForm.bankDetails.bankName}
                      onChange={e => setPaymentForm({ ...paymentForm, bankDetails: { ...paymentForm.bankDetails, bankName: e.target.value } })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Account Name"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={paymentForm.bankDetails.accountName}
                      onChange={e => setPaymentForm({ ...paymentForm, bankDetails: { ...paymentForm.bankDetails, accountName: e.target.value } })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Account Number"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={paymentForm.bankDetails.accountNumber}
                      onChange={e => setPaymentForm({ ...paymentForm, bankDetails: { ...paymentForm.bankDetails, accountNumber: e.target.value } })}
                      required
                    />
                  </div>
                </>
              )}

              {paymentForm.type === 'paypal' && (
                <div className="mb-3">
                  <input
                    type="email"
                    placeholder="PayPal Email"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={paymentForm.paypalDetails.email}
                    onChange={e => setPaymentForm({ ...paymentForm, paypalDetails: { email: e.target.value } })}
                    required
                  />
                </div>
              )}

              {(paymentForm.type === 'vodafone_cash' || paymentForm.type === 'instapay') && (
                <div className="mb-3">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={paymentForm.mobileWalletDetails.phoneNumber}
                    onChange={e => setPaymentForm({ ...paymentForm, mobileWalletDetails: { ...paymentForm.mobileWalletDetails, phoneNumber: e.target.value } })}
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Add</button>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerStoreSettings;