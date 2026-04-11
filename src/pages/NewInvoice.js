import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaTrash, FaPlus, FaSave, FaArrowLeft, FaPrint, FaUser, FaBox, FaMoneyBillWave, FaTag, FaTruck } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const NewInvoice = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerDetails, setCustomerDetails] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage');
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find(c => c._id === selectedCustomer);
      setCustomerDetails(customer);
    }
  }, [selectedCustomer, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers.');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products.');
    }
  };

  const addToCart = () => {
    if (!selectedProduct) {
      toast.error('Please select a product.');
      return;
    }
    const product = products.find(p => p._id === selectedProduct);
    if (!product) return;
    if (product.quantity < quantity) {
      toast.error(`Insufficient stock. Available: ${product.quantity}`);
      return;
    }

    const existingItem = cart.find(item => item.productId === product._id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product._id 
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product._id,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
        imageUrl: product.imageUrl
      }]);
    }
    setSelectedProduct('');
    setQuantity(1);
    toast.success(`${product.name} added to invoice.`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    const item = cart.find(i => i.productId === productId);
    const product = products.find(p => p._id === productId);
    if (product && product.quantity < newQuantity) {
      toast.error(`Insufficient stock. Available: ${product.quantity}`);
      return;
    }
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
        : item
    ));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return Math.min(discount, subtotal);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return subtotal - discountAmount + shippingCost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Please add at least one product.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/invoices`, {
        customerId: selectedCustomer,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        discount: calculateDiscountAmount(),
        shippingCost,
        notes
      });
      toast.success('Invoice created successfully!');
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create invoice.');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscountAmount();
  const total = calculateTotal();

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/invoices" className="text-gray-600 hover:text-gray-800">
          <FaArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">New Invoice</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Customer & Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaUser className="text-blue-600" />
              Customer Information
            </h2>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
            {customerDetails && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{customerDetails.address}</p>
                {customerDetails.email && <p className="text-sm text-gray-600">{customerDetails.email}</p>}
              </div>
            )}
            {customers.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No customers found. <Link to="/customers" className="text-blue-600">Add a customer</Link> first.
              </p>
            )}
          </div>

          {/* Add Products */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaBox className="text-green-600" />
              Add Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Product</option>
                {products.filter(p => p.quantity > 0).map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name} - {product.price.toLocaleString()} EGP
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addToCart}
                className="bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
              >
                <FaPlus /> Add
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Items</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items added yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Qty</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Price</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.productId} className="border-t">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="w-8 h-8 object-cover rounded" />}
                              <span className="font-medium">{item.productName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                              min="1"
                              className="w-16 px-2 py-1 border rounded text-center"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">{item.unitPrice.toLocaleString()} EGP</td>
                          <td className="px-4 py-3 text-right font-semibold">{item.subtotal.toLocaleString()} EGP</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => removeFromCart(item.productId)} className="text-red-600 hover:text-red-800">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaMoneyBillWave className="text-yellow-600" />
              Invoice Summary
            </h2>
            
            <div className="space-y-3 pb-4 border-b">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{subtotal.toLocaleString()} EGP</span>
              </div>
              
              {/* Discount */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Discount"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border rounded text-sm"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">EGP</option>
                </select>
                <span className="text-sm text-gray-500">Discount</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount Amount</span>
                  <span>-{discountAmount.toLocaleString()} EGP</span>
                </div>
              )}
              
              {/* Shipping */}
              <div className="flex items-center gap-2">
                <FaTruck className="text-gray-400" />
                <input
                  type="number"
                  placeholder="Shipping cost"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <span className="text-sm text-gray-500">EGP</span>
              </div>
            </div>
            
            {/* Total */}
            <div className="flex justify-between py-4 text-lg font-bold">
              <span>Total</span>
              <span className="text-blue-600">{total.toLocaleString()} EGP</span>
            </div>
            
            {/* Notes */}
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes for this invoice..."
              />
            </div>
            
            {/* Create Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || cart.length === 0 || !selectedCustomer}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              <FaSave /> {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInvoice;