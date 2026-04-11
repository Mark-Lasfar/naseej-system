import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaCopy, FaCheckCircle, FaMobileAlt, FaBuilding, FaUniversity, FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const PaymentInstructions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    // استعادة البيانات من location state أو localStorage
    if (location.state) {
      setInstruction(location.state.paymentInstruction);
      setOrderNumber(location.state.orderNumber);
      setPaymentMethod(location.state.paymentMethod);
    } else {
      const saved = localStorage.getItem('pendingPayment');
      if (saved) {
        const data = JSON.parse(saved);
        setInstruction(data.instruction);
        setOrderNumber(data.orderNumber);
        setPaymentMethod(data.paymentMethod);
      } else {
        navigate('/shop');
      }
    }
  }, [location, navigate]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'vodafone_cash':
        return <FaMobileAlt className="text-red-600 text-4xl" />;
      case 'instapay':
        return <FaMobileAlt className="text-green-600 text-4xl" />;
      case 'bank':
        return <FaUniversity className="text-blue-600 text-4xl" />;
      default:
        return <FaBuilding className="text-gray-600 text-4xl" />;
    }
  };

  const getPaymentMethodName = () => {
    switch (paymentMethod) {
      case 'vodafone_cash':
        return 'Vodafone Cash';
      case 'instapay':
        return 'InstaPay';
      case 'bank':
        return 'Bank Transfer';
      default:
        return paymentMethod;
    }
  };

  if (!instruction) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
          {getPaymentMethodIcon()}
          <h1 className="text-2xl font-bold mt-3">Complete Your Payment</h1>
          <p className="text-white/80 mt-1">Order #{orderNumber}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount */}
          <div className="text-center border-b pb-4">
            <p className="text-gray-500 text-sm">Amount to Pay</p>
            <p className="text-3xl font-bold text-blue-600">{instruction.amount?.toLocaleString()} EGP</p>
          </div>

          {/* Payment Instructions */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Payment Instructions
            </h3>
            
            {paymentMethod === 'vodafone_cash' && (
              <div className="space-y-3">
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">1. Open Vodafone Cash App</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">2. Send to this number:</p>
                  <div className="flex items-center justify-between mt-2">
                    <code className="text-lg font-mono font-bold">{instruction.merchantPhone}</code>
                    <button 
                      onClick={() => copyToClipboard(instruction.merchantPhone)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                    >
                      <FaCopy /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">3. Enter amount: <span className="font-bold">{instruction.amount} EGP</span></p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">4. Use reference: <span className="font-mono">{instruction.reference}</span></p>
                </div>
              </div>
            )}

            {paymentMethod === 'instapay' && (
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">1. Open InstaPay App</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">2. Send to:</p>
                  <div className="flex items-center justify-between mt-2">
                    <code className="text-lg font-mono font-bold">{instruction.merchantPhone}</code>
                    <button onClick={() => copyToClipboard(instruction.merchantPhone)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                      <FaCopy /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">3. Amount: <span className="font-bold">{instruction.amount} EGP</span></p>
                </div>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Bank Details:</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Bank Name:</span> {instruction.bankDetails?.bankName}</p>
                    <p><span className="font-medium">Account Name:</span> {instruction.bankDetails?.accountName}</p>
                    <p><span className="font-medium">Account Number:</span> {instruction.bankDetails?.accountNumber}</p>
                    {instruction.bankDetails?.iban && <p><span className="font-medium">IBAN:</span> {instruction.bankDetails.iban}</p>}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Amount: <span className="font-bold">{instruction.amount} EGP</span></p>
                </div>
              </div>
            )}

            {/* WhatsApp Contact */}
            <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaWhatsapp className="text-green-600 text-xl" />
                <span className="text-sm">Need help? Contact us on WhatsApp</span>
              </div>
              <a href="https://wa.me/201000000000" className="text-green-600 text-sm font-medium hover:underline">
                Chat Now →
              </a>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">
              ⚠️ <span className="font-medium">Important:</span> After completing the payment, your order will be confirmed automatically within 5-10 minutes. Please keep the transaction receipt.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Link 
              to={`/order-tracking/${orderNumber}`}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-center font-medium hover:bg-blue-700 transition"
            >
              Track Order
            </Link>
            <Link 
              to="/shop"
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg text-center font-medium hover:bg-gray-300 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Note about webhook */}
      <div className="text-center text-xs text-gray-400 mt-6">
        <p>Once payment is completed, we'll update your order status automatically.</p>
        <p className="mt-1">Reference: {instruction.reference}</p>
      </div>
    </div>
  );
};

export default PaymentInstructions;