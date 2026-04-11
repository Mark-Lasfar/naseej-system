import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaBuilding, FaPaypal, FaMobileAlt, FaPlus, FaEdit, FaTrash, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';


const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const SellerPayouts = () => {
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [formData, setFormData] = useState({
    type: 'bank',
    isDefault: false,
    bankDetails: { bankName: '', accountName: '', accountNumber: '', iban: '', swiftCode: '' },
    paypalDetails: { email: '' },
    mobileWalletDetails: { phoneNumber: '', provider: 'vodafone' }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [methodsRes, transactionsRes] = await Promise.all([
        axios.get(`${API_URL}/payouts/methods`),
        axios.get(`${API_URL}/payouts/transactions`)
      ]);
      setPayoutMethods(methodsRes.data);
      setTransactions(transactionsRes.data.transactions);
      setStats(transactionsRes.data.stats);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/payouts/methods`, formData);
      toast.success('Payment method added');
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add method');
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      await axios.put(`${API_URL}/payouts/methods/${methodId}/default`);
      toast.success('Default payment method updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update default method');
    }
  };

  const handleDeleteMethod = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await axios.delete(`${API_URL}/payouts/methods/${id}`);
        toast.success('Payment method deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete method');
      }
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount < 500) {
      toast.error('Minimum withdrawal amount is 500 EGP');
      return;
    }
    
    const defaultMethod = payoutMethods.find(m => m.isDefault);
    if (!defaultMethod) {
      toast.error('Please set a default payment method first');
      return;
    }
    
    if (withdrawAmount > stats.availableBalance) {
      toast.error('Insufficient balance');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/payouts/withdraw`, {
        amount: withdrawAmount,
        methodId: defaultMethod._id
      });
      toast.success('Withdrawal request submitted successfully');
      setWithdrawAmount('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to withdraw');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'bank',
      isDefault: false,
      bankDetails: { bankName: '', accountName: '', accountNumber: '', iban: '', swiftCode: '' },
      paypalDetails: { email: '' },
      mobileWalletDetails: { phoneNumber: '', provider: 'vodafone' }
    });
    setEditingMethod(null);
  };

const getMethodIcon = (type) => {
  switch (type) {
    case 'bank': return <FaBuilding className="text-blue-600 text-xl" />;
    case 'paypal': return <FaPaypal className="text-blue-600 text-xl" />;
    default: return <FaMobileAlt className="text-green-600 text-xl" />;
  }
};


  const getMethodDisplay = (method) => {
    switch (method.type) {
      case 'bank':
        return `${method.bankDetails.bankName} - ${method.bankDetails.accountNumber}`;
      case 'paypal':
        return method.paypalDetails.email;
      default:
        return method.mobileWalletDetails.phoneNumber;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">💰 Payout Settings</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalEarnings?.toLocaleString() || 0} EGP</p>
          <p className="text-xs text-gray-500">Total Earnings</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.availableBalance?.toLocaleString() || 0} EGP</p>
          <p className="text-xs text-gray-500">Available Balance</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingAmount?.toLocaleString() || 0} EGP</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.totalTransactions || 0}</p>
          <p className="text-xs text-gray-500">Transactions</p>
        </div>
      </div>

      {/* Withdraw Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Request Withdrawal</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="number"
            placeholder="Amount (EGP)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleWithdraw}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Withdraw
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Minimum withdrawal: 500 EGP • Available: {stats.availableBalance?.toLocaleString()} EGP</p>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Payment Methods</h2>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <FaPlus /> Add Method
          </button>
        </div>
        
        {payoutMethods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaMoneyBillWave className="text-4xl mx-auto mb-2 text-gray-300" />
            <p>No payment methods added yet.</p>
            <p className="text-sm">Add a method to receive your payouts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payoutMethods.map(method => (
              <div key={method._id} className={`flex items-center justify-between p-4 border rounded-lg transition ${method.isDefault ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  {getMethodIcon(method.type)}
                  <div>
                    <p className="font-medium capitalize">{method.type === 'bank' ? 'Bank Transfer' : method.type === 'paypal' ? 'PayPal' : method.type === 'vodafone_cash' ? 'Vodafone Cash' : 'InstaPay'}</p>
                    <p className="text-sm text-gray-500">{getMethodDisplay(method)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <button onClick={() => handleSetDefault(method._id)} className="text-sm text-green-600 hover:text-green-800">
                      Set Default
                    </button>
                  )}
                  {method.isDefault && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                      <FaCheckCircle size={10} /> Default
                    </span>
                  )}
                  <button onClick={() => handleDeleteMethod(method._id)} className="text-red-600 hover:text-red-800 p-1">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions History */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Order #</th>
                  <th className="px-4 py-2 text-left text-sm">Date</th>
                  <th className="px-4 py-2 text-right text-sm">Amount</th>
                  <th className="px-4 py-2 text-right text-sm">Commission</th>
                  <th className="px-4 py-2 text-right text-sm">You Get</th>
                  <th className="px-4 py-2 text-left text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{transaction.orderId?.orderNumber || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">{transaction.amount.toLocaleString()} EGP</td>
                    <td className="px-4 py-3 text-right text-red-600">-{transaction.platformCommission.toLocaleString()} EGP</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{transaction.sellerAmount.toLocaleString()} EGP</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status === 'held' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status === 'completed' ? 'Paid' : transaction.status === 'pending' ? 'Pending' : transaction.status === 'held' ? 'On Hold' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Payment Method</h2>
            <form onSubmit={handleAddMethod}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Method Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="vodafone_cash">Vodafone Cash</option>
                  <option value="instapay">InstaPay</option>
                </select>
              </div>
              
              {formData.type === 'bank' && (
                <>
                  <div className="mb-3"><input type="text" placeholder="Bank Name" className="w-full px-3 py-2 border rounded-lg" value={formData.bankDetails.bankName} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })} required /></div>
                  <div className="mb-3"><input type="text" placeholder="Account Name" className="w-full px-3 py-2 border rounded-lg" value={formData.bankDetails.accountName} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountName: e.target.value } })} required /></div>
                  <div className="mb-3"><input type="text" placeholder="Account Number" className="w-full px-3 py-2 border rounded-lg" value={formData.bankDetails.accountNumber} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })} required /></div>
                  <div className="mb-3"><input type="text" placeholder="IBAN (Optional)" className="w-full px-3 py-2 border rounded-lg" value={formData.bankDetails.iban} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, iban: e.target.value } })} /></div>
                </>
              )}
              
              {formData.type === 'paypal' && (
                <div className="mb-3"><input type="email" placeholder="PayPal Email" className="w-full px-3 py-2 border rounded-lg" value={formData.paypalDetails.email} onChange={(e) => setFormData({ ...formData, paypalDetails: { email: e.target.value } })} required /></div>
              )}
              
              {(formData.type === 'vodafone_cash' || formData.type === 'instapay') && (
                <div className="mb-3"><input type="tel" placeholder="Phone Number" className="w-full px-3 py-2 border rounded-lg" value={formData.mobileWalletDetails.phoneNumber} onChange={(e) => setFormData({ ...formData, mobileWalletDetails: { ...formData.mobileWalletDetails, phoneNumber: e.target.value } })} required /></div>
              )}
              
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} />
                <label htmlFor="isDefault" className="text-sm">Set as default payment method</label>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Save</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPayouts;