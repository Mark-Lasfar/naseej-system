import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaTrash, FaArrowLeft, FaArrowRight, FaPaypal, FaMoneyBillWave, 
  FaTruck, FaTag, FaCreditCard, FaShieldAlt, FaCheckCircle,
  FaMinus, FaPlus, FaStore, FaMobileAlt, FaUniversity,
  FaBuilding, FaEnvelope, FaPhoneAlt, FaInfoCircle
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// طرق الدفع الافتراضية للمنصة (Admin)
const DEFAULT_PAYMENT_METHODS = [
  { type: 'cash', name: 'Cash on Delivery', icon: <FaMoneyBillWave className="text-green-600 text-2xl" />, isActive: true, description: 'Pay when you receive your order' },
  { type: 'paypal', name: 'PayPal', icon: <FaPaypal className="text-blue-600 text-2xl" />, isActive: true, description: 'Secure payment via PayPal' },
  { type: 'card', name: 'Credit/Debit Card', icon: <FaCreditCard className="text-purple-600 text-2xl" />, isActive: true, description: 'Visa, Mastercard, Meeza' }
];

const Cart = ({ cartItems, removeFromCart, updateQuantity, clearCart }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [shippingCost, setShippingCost] = useState(0);
  const [estimatedDays, setEstimatedDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    street: '',
    city: '',
    district: '',
    notes: '',
    paymentMethod: 'cash'
  });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  
  // ✅ طرق الدفع الديناميكية
  const [storePaymentMethods, setStorePaymentMethods] = useState({});
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [isMultiStore, setIsMultiStore] = useState(false);
  const [showPaymentInstruction, setShowPaymentInstruction] = useState(false);
  const [paymentInstruction, setPaymentInstruction] = useState(null);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discount + shippingCost;

  // تحليل عناصر السلة ومعرفة المتاجر الموجودة
  const getStoreBreakdown = () => {
    const storeMap = new Map();
    cartItems.forEach(item => {
      const storeId = item.storeId || 'admin';
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          storeId,
          storeName: item.storeName || 'Naseej Official',
          items: [],
          subtotal: 0
        });
      }
      const store = storeMap.get(storeId);
      store.items.push(item);
      store.subtotal += item.price * item.quantity;
    });
    return Array.from(storeMap.values());
  };

  const storeBreakdown = getStoreBreakdown();
  const isMultiStoreCart = storeBreakdown.length > 1;

  // جلب طرق الدفع لكل متجر
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const methods = {};
      for (const store of storeBreakdown) {
        if (store.storeId !== 'admin') {
          try {
            const response = await axios.get(`${API_URL}/stores/${store.storeId}/payment-methods`);
            methods[store.storeId] = response.data.filter(m => m.isActive);
          } catch (error) {
            console.error(`Failed to fetch payment methods for store ${store.storeId}:`, error);
            methods[store.storeId] = [];
          }
        } else {
          // المتجر الرئيسي (Admin) يستخدم الطرق الافتراضية
          methods[store.storeId] = DEFAULT_PAYMENT_METHODS;
        }
      }
      setStorePaymentMethods(methods);
      
      // دمج طرق الدفع المتاحة (الطرق المشتركة بين كل المتاجر)
      if (isMultiStoreCart) {
        const commonMethods = getCommonPaymentMethods(methods);
        setAvailablePaymentMethods(commonMethods);
      } else if (storeBreakdown.length === 1) {
        setAvailablePaymentMethods(methods[storeBreakdown[0].storeId] || DEFAULT_PAYMENT_METHODS);
      }
    };
    
    if (cartItems.length > 0) {
      fetchPaymentMethods();
    }
  }, [cartItems]);

  // دالة لدمج طرق الدفع المشتركة بين المتاجر
  const getCommonPaymentMethods = (methods) => {
    const allMethods = Object.values(methods);
    if (allMethods.length === 0) return DEFAULT_PAYMENT_METHODS;
    
    // جلب أنواع طرق الدفع من أول متجر
    const firstStoreTypes = new Set(allMethods[0].map(m => m.type));
    
    // التحقق من الطرق المشتركة بين كل المتاجر
    for (const storeMethods of allMethods) {
      const storeTypes = new Set(storeMethods.map(m => m.type));
      for (const type of firstStoreTypes) {
        if (!storeTypes.has(type)) {
          firstStoreTypes.delete(type);
        }
      }
    }
    
    // إرجاع الطرق المشتركة فقط
    return allMethods[0].filter(m => firstStoreTypes.has(m.type));
  };

  // عرض تفاصيل طريقة الدفع حسب النوع
  const renderPaymentMethodDetails = (method) => {
    switch (method.type) {
      case 'bank':
        return (
          <div className="mt-2 text-sm text-gray-500">
            <p><FaBuilding className="inline mr-1" /> {method.bankDetails?.bankName || 'Bank Transfer'}</p>
            <p><FaEnvelope className="inline mr-1" /> Account: {method.bankDetails?.accountNumber || 'N/A'}</p>
          </div>
        );
      case 'vodafone_cash':
      case 'instapay':
        return (
          <div className="mt-2 text-sm text-gray-500">
            <p><FaMobileAlt className="inline mr-1" /> Phone: {method.mobileWalletDetails?.phoneNumber || 'N/A'}</p>
            <p>Provider: {method.mobileWalletDetails?.provider || 'Vodafone'}</p>
          </div>
        );
      case 'paypal':
        return (
          <div className="mt-2 text-sm text-gray-500">
            <p><FaPaypal className="inline mr-1" /> {method.paypalDetails?.email || 'PayPal'}</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Load saved shipping info from localStorage
  useEffect(() => {
    const savedInfo = localStorage.getItem('shippingInfo');
    if (savedInfo) {
      setFormData(JSON.parse(savedInfo));
    }
    const addresses = localStorage.getItem('savedAddresses');
    if (addresses) {
      setSavedAddresses(JSON.parse(addresses));
    }
  }, []);

  // Save shipping info to localStorage
  useEffect(() => {
    if (formData.customerName || formData.city) {
      localStorage.setItem('shippingInfo', JSON.stringify(formData));
    }
  }, [formData]);

  // Calculate shipping cost when city changes
  useEffect(() => {
    if (formData.city) {
      fetchShippingCost();
    }
  }, [formData.city, subtotal]);

  const fetchShippingCost = async () => {
    try {
      const response = await axios.post(`${API_URL}/orders/shipping-cost`, {
        city: formData.city,
        district: formData.district,
        subtotal
      });
      setShippingCost(response.data.shippingCost);
      setEstimatedDays(response.data.estimatedDays);
    } catch (error) {
      console.error('Error fetching shipping cost:', error);
      setShippingCost(subtotal >= 1000 ? 0 : 50);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    setIsApplyingCoupon(true);
    try {
      const response = await axios.post(`${API_URL}/coupons/validate`, {
        code: couponCode,
        subtotal
      });
      setDiscount(response.data.discount);
      setAppliedCoupon(response.data.coupon);
      toast.success(`Coupon applied! You saved ${response.data.discount.toLocaleString()} EGP`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid coupon code');
      setDiscount(0);
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadSavedAddress = (address) => {
    setFormData({
      ...formData,
      customerName: address.name,
      customerPhone: address.phone,
      street: address.street,
      city: address.city,
      district: address.district
    });
    toast.success('Address loaded');
  };

  const saveCurrentAddress = () => {
    if (formData.customerName && formData.street && formData.city) {
      const newAddress = {
        id: Date.now(),
        name: formData.customerName,
        phone: formData.customerPhone,
        street: formData.street,
        city: formData.city,
        district: formData.district
      };
      const updated = [...savedAddresses, newAddress];
      setSavedAddresses(updated);
      localStorage.setItem('savedAddresses', JSON.stringify(updated));
      toast.success('Address saved for future use');
    } else {
      toast.error('Please fill in name, street and city first');
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.customerName || !formData.customerPhone || !formData.street || !formData.city) {
    toast.error('Please fill in all required fields');
    return;
  }
  
  setLoading(true);

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    let customerId = localStorage.getItem('customerId');
    
    if (!customerId) {
      const customerResponse = await axios.post(`${API_URL}/customers`, {
        name: formData.customerName,
        phone: formData.customerPhone,
        email: formData.customerEmail || `${Date.now()}@temp.com`,
        address: `${formData.street}, ${formData.district}, ${formData.city}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      customerId = customerResponse.data._id;
      localStorage.setItem('customerId', customerId);
    }

    const orderResponse = await axios.post(`${API_URL}/orders`, {
      customerId,
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        storeId: item.storeId
      })),
      shippingAddress: {
        street: formData.street,
        city: formData.city,
        district: formData.district,
        phone: formData.customerPhone,
        email: formData.customerEmail,
        notes: formData.notes
      },
      paymentMethod: formData.paymentMethod,
      couponCode: appliedCoupon?.code || ''
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (orderResponse.data.success) {
      // ✅ معالجة PayPal
      if (formData.paymentMethod === 'paypal' && orderResponse.data.paymentUrl) {
        window.location.href = orderResponse.data.paymentUrl;
      } 
      // ✅ معالجة Stripe/Card
      else if (formData.paymentMethod === 'card' && orderResponse.data.paymentUrl) {
        window.location.href = orderResponse.data.paymentUrl;
      } 
      // ✅ معالجة Vodafone Cash, InstaPay, Bank Transfer (تعليمات دفع)
      else if (orderResponse.data.paymentInstruction) {
        const instruction = orderResponse.data.paymentInstruction;
        
        // حفظ تعليمات الدفع في localStorage
        localStorage.setItem('pendingPayment', JSON.stringify({
          orderNumber: orderResponse.data.order.orderNumber,
          instruction: instruction,
          amount: instruction.amount,
          paymentMethod: formData.paymentMethod
        }));
        
        // التوجه إلى صفحة تعليمات الدفع
        navigate('/payment-instructions', { 
          state: { 
            paymentInstruction: instruction,
            orderNumber: orderResponse.data.order.orderNumber,
            paymentMethod: formData.paymentMethod
          } 
        });
      } 
      // ✅ Cash on Delivery
      else {
        toast.success('Order placed successfully!');
        clearCart();
        localStorage.removeItem('shippingInfo');
        localStorage.removeItem('cart');
        navigate(`/order-tracking/${orderResponse.data.order.orderNumber}`);
      }
    }
  } catch (error) {
    console.error('Order error:', error);
    toast.error(error.response?.data?.error || 'Failed to place order');
  } finally {
    setLoading(false);
  }
};

  const goToNextStep = () => {
    if (step === 1 && cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setStep(step + 1);
  };

  if (cartItems.length === 0 && step === 1) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
        <Link to="/shop" className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-blue-700">
          <FaStore className="inline mr-2" /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link to="/shop" className="text-gray-600 hover:text-gray-800 flex items-center gap-2">
          <FaArrowLeft /> Continue Shopping
        </Link>
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <div className="w-24"></div>
      </div>

      {/* Multi-Store Warning */}
      {isMultiStoreCart && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 text-sm flex items-center gap-2">
            <FaStore /> Your cart contains items from multiple stores. Payment will be processed separately for each store.
          </p>
        </div>
      )}

      {/* Store Breakdown */}
      {isMultiStoreCart && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="font-semibold mb-2">Order Summary by Store</h3>
          {storeBreakdown.map(store => (
            <div key={store.storeId} className="flex justify-between items-center py-2 border-b last:border-0">
              <span>{store.storeName}</span>
              <span className="font-semibold">{store.subtotal.toLocaleString()} EGP</span>
            </div>
          ))}
        </div>
      )}

      {/* Steps Indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Cart Items */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Product</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">Quantity</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Price</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.productId} className="border-t">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded" />}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">Store: {item.storeName || 'Naseej'}</p>
                              <p className="text-sm text-gray-500">{item.price.toLocaleString()} EGP each</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200 flex items-center justify-center"><FaMinus size={12} /></button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200 flex items-center justify-center"><FaPlus size={12} /></button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">{item.price.toLocaleString()} EGP</td>
                        <td className="px-6 py-4 text-right font-semibold">{(item.price * item.quantity).toLocaleString()} EGP</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end">
                <button onClick={goToNextStep} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                  Proceed to Checkout <FaArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping Information */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
              
              {savedAddresses.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Saved Addresses</label>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr) => (
                      <button key={addr.id} onClick={() => loadSavedAddress(addr)} className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">{addr.name} - {addr.city}</button>
                    ))}
                  </div>
                </div>
              )}
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Full Name *</label><input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Phone Number *</label><input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Street Address *</label><input type="text" name="street" value={formData.street} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">City *</label><select name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" required><option value="">Select City</option><option value="Cairo">Cairo</option><option value="Alexandria">Alexandria</option><option value="Giza">Giza</option><option value="Mansoura">Mansoura</option><option value="Tanta">Tanta</option><option value="Other">Other</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">District</label><input type="text" name="district" value={formData.district} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Nasr City, Maadi..." /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Order Notes (Optional)</label><textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border rounded-lg" placeholder="Special instructions, preferred delivery time, etc." /></div>
                <div className="flex justify-between pt-4">
                  <button type="button" onClick={saveCurrentAddress} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Save Address</button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(1)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Back</button>
                    <button type="button" onClick={() => setStep(3)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Continue to Payment</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Payment Method */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Payment Method</h2>
              
              {isMultiStoreCart && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">You're purchasing from multiple stores. The payment will be processed securely.</p>
                </div>
              )}
              
              <div className="space-y-4">
                {availablePaymentMethods.map((method, idx) => (
                  <label key={idx} className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${formData.paymentMethod === method.type ? 'border-blue-600 bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="paymentMethod" value={method.type} checked={formData.paymentMethod === method.type} onChange={handleInputChange} className="mr-3 w-4 h-4 mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {method.icon}
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-gray-500">{method.description || 'Select this payment method'}</p>
                          {renderPaymentMethodDetails(method)}
                        </div>
                      </div>
                    </div>
                    {method.type === 'cash' && <FaMoneyBillWave className="text-green-600 text-2xl" />}
                    {method.type === 'paypal' && <FaPaypal className="text-blue-600 text-2xl" />}
                    {method.type === 'card' && <FaCreditCard className="text-purple-600 text-2xl" />}
                  </label>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2"><FaShieldAlt className="text-blue-600" /><p className="text-sm font-medium text-blue-800">Secure Payment</p></div>
                <p className="text-xs text-blue-600">Your payment information is encrypted and secure. We never store your card details.</p>
              </div>

              <div className="flex justify-between mt-6 pt-6 border-t">
                <button onClick={() => setStep(2)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50">
                  {loading ? 'Processing...' : `Place Order • ${total.toLocaleString()} EGP`}
                  {!loading && <FaCheckCircle />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            
            <div className="space-y-2 pb-4 border-b max-h-60 overflow-y-auto">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                  <span>{(item.price * item.quantity).toLocaleString()} EGP</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 py-4 border-b">
              <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toLocaleString()} EGP</span></div>
              
              {!appliedCoupon ? (
                <div className="flex gap-2 mt-2">
                  <input type="text" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button onClick={applyCoupon} disabled={isApplyingCoupon} className="px-3 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50">{isApplyingCoupon ? '...' : 'Apply'}</button>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg">
                  <div className="flex items-center gap-2"><FaTag className="text-green-600" /><span className="text-sm text-green-700">{appliedCoupon.code}</span></div>
                  <button onClick={removeCoupon} className="text-red-500 text-sm hover:text-red-700">Remove</button>
                </div>
              )}
              
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{discount.toLocaleString()} EGP</span></div>}
              <div className="flex justify-between"><div className="flex items-center gap-1"><FaTruck /><span>Shipping</span></div><span>{shippingCost === 0 ? 'Free' : `${shippingCost.toLocaleString()} EGP`}</span></div>
            </div>
            
            <div className="flex justify-between py-4 text-lg font-bold"><span>Total</span><span className="text-blue-600">{total.toLocaleString()} EGP</span></div>
            
            {subtotal >= 1000 && shippingCost > 0 && <p className="text-sm text-green-600 text-center">🎉 You qualify for free shipping! Continue to checkout.</p>}
            {subtotal < 1000 && <p className="text-sm text-orange-600 text-center">🎁 Add {Math.max(0, 1000 - subtotal).toLocaleString()} EGP more for free shipping!</p>}
            {estimatedDays && step === 2 && <p className="text-sm text-gray-500 text-center mt-2">Estimated delivery: {estimatedDays} business days after order confirmation</p>}
            
            <div className="mt-4 pt-4 border-t text-center">
              <div className="flex justify-center gap-4 text-gray-400 text-xs"><span className="flex items-center gap-1"><FaShieldAlt /> Secure</span><span>🔒 Encrypted</span><span>✓ Verified</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Instruction Modal */}
      {showPaymentInstruction && paymentInstruction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setShowPaymentInstruction(false);
                navigate(`/order-tracking/${paymentInstruction.reference}`);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
            
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaMobileAlt className="text-blue-600 text-2xl" />
              </div>
              <h2 className="text-xl font-bold">Payment Required</h2>
              <p className="text-gray-500 text-sm mt-1">Complete your payment to confirm the order</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Payment Instructions:</p>
              <p className="text-gray-600 whitespace-pre-line">{paymentInstruction.instruction}</p>
              {paymentInstruction.bankDetails && (
                <div className="mt-3 p-2 bg-white rounded border">
                  <p className="text-sm font-medium">Bank: {paymentInstruction.bankDetails.bankName}</p>
                  <p className="text-sm">Account: {paymentInstruction.bankDetails.accountNumber}</p>
                  <p className="text-sm">Name: {paymentInstruction.bankDetails.accountName}</p>
                </div>
              )}
              {paymentInstruction.merchantPhone && (
                <div className="mt-3 p-2 bg-white rounded border">
                  <p className="text-sm font-medium">Merchant: {paymentInstruction.merchantPhone}</p>
                  <p className="text-sm text-gray-500">Amount: {paymentInstruction.amount} EGP</p>
                  <p className="text-sm text-gray-500">Reference: {paymentInstruction.reference}</p>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800 flex items-center gap-2">
                <FaInfoCircle /> After payment, please wait for confirmation. Your order will be processed once payment is verified.
              </p>
            </div>
            
            <button
              onClick={() => {
                setShowPaymentInstruction(false);
                navigate(`/order-tracking/${paymentInstruction.reference}`);
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Order Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;