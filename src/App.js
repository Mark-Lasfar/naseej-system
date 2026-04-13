import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';

// Components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SocialFeed from './pages/SocialFeed';
import SocialHome from './pages/SocialHome';

import Products from './pages/Products';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import NewInvoice from './pages/NewInvoice';
import Navbar from './components/Navbar';
import ProductDetails from './pages/ProductDetails';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import StorePage from './pages/StorePage';
import StoreProduct from './pages/StoreProduct';
import OrderTracking from './pages/OrderTracking';
import AdminOrders from './pages/AdminOrders';
import MyOrders from './pages/MyOrders';
import PaymentInstructions from './pages/PaymentInstructions';

import DesignStudio from './pages/DesignStudio';
import MaterialLibrary from './pages/MaterialLibrary';
import ProductionPartner from './pages/ProductionPartner';


// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerOrders from './pages/seller/SellerOrders';
import SellerPayouts from './pages/seller/SellerPayouts';
import SellerProfitAnalytics from './pages/seller/SellerProfitAnalytics';
import SellerIntegrations from './pages/seller/SellerIntegrations';

import SellerStoreSettings from './pages/seller/SellerStoreSettings';

// User Pages
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Chat from './pages/Chat';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://mgzon-naseej-backend.hf.space/api'
    : 'http://localhost:5000/api');
    
// Axios interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (process.env.NODE_ENV === 'production') {
    config.baseURL = '';
  } else {
    config.baseURL = API_URL;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.productId);
      if (existingItem) {
        return prevItems.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      }
      return [...prevItems, { ...product }];
    });
    toast.success(`${product.name} added to cart!`);
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    setShowLoginModal(false);
    toast.success(`Welcome back, ${userData.username}!`);
  };

  const handleLogout = async () => {
    try {
      // ✅ تحديث حالة المستخدم إلى غير متصل
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_URL}/user/offline`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('cart');
      localStorage.removeItem('customerId');
      localStorage.removeItem('recentlyViewed');
      setIsAuthenticated(false);
      setUser(null);
      setCartItems([]);
      toast.success('Logged out successfully.');
    }
  };
  const openLoginModal = () => {
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const isSeller = user?.role === 'seller' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  // ✅ دالة لعرض المحتوى العادي (مع container)
 const MainLayout = ({ children }) => (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
    {children}
  </div>
);


  // ✅ دالة لعرض الشات (بدون container، يأخذ كامل العرض)
 const ChatLayout = ({ children }) => (
  <div className="h-[calc(100vh-64px)] lg:h-[calc(100vh-72px)]">
    {children}
  </div>
);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar
          user={user}
          onLogout={handleLogout}
          onLogin={openLoginModal}
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        />

        <Routes>
          {/* ================ الصفحة الرئيسية ================ */}
          <Route
            path="/"
            element={isAuthenticated ?
              <MainLayout><SocialHome user={user} /></MainLayout> :
              <Navigate to="/shop" replace />}
          />

          {/* ================ الصفحات العامة (تظهر للجميع) ================ */}
          <Route path="/shop" element={<MainLayout><Shop addToCart={addToCart} cartItems={cartItems} /></MainLayout>} />
          <Route path="/shop/:storeSlug" element={<MainLayout><StorePage addToCart={addToCart} /></MainLayout>} />
          <Route path="/shop/:storeSlug/product/:productSlug" element={<MainLayout><StoreProduct addToCart={addToCart} /></MainLayout>} />
          <Route path="/product/:slug" element={<MainLayout><ProductDetails addToCart={addToCart} /></MainLayout>} />
          <Route path="/cart" element={<MainLayout><Cart
            cartItems={cartItems}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            clearCart={clearCart}
          /></MainLayout>} />
          <Route path="/order-tracking/:orderNumber" element={<MainLayout><OrderTracking /></MainLayout>} />
          <Route path="/track-order" element={<MainLayout><OrderTracking /></MainLayout>} />

          {/* ================ Feed (للمسجلين فقط) ================ */}
          <Route
            path="/feed"
            element={isAuthenticated ?
              <MainLayout><SocialFeed user={user} /></MainLayout> :
              <Navigate to="/shop" replace />}
          />

          {/* ================ Chat Routes - بدون container ================ */}
          {isAuthenticated && (
            <>
              <Route path="/chat" element={<ChatLayout><Chat /></ChatLayout>} />
              <Route path="/chat/:conversationId" element={<ChatLayout><Chat /></ChatLayout>} />
            </>
          )}

          {/* ================ الصفحات التي تحتاج تسجيل دخول ================ */}
          {isAuthenticated ? (
            <>
              <Route path="/my-orders" element={<MainLayout><MyOrders /></MainLayout>} />
              <Route path="/wishlist" element={<MainLayout><Wishlist /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
              <Route path="/payment-instructions" element={<MainLayout><PaymentInstructions /></MainLayout>} />

              {/* AI Design Routes */}
              <Route path="/design-studio" element={<MainLayout><DesignStudio addToCart={addToCart} /></MainLayout>} />
              <Route path="/material-library" element={<MainLayout><MaterialLibrary /></MainLayout>} />
              <Route path="/production-partner" element={<MainLayout><ProductionPartner /></MainLayout>} /> {/* ✅ أضف هذا السطر */}


              {/* Seller Routes */}
              {isSeller && (
                <>
                  <Route path="/seller/dashboard" element={<MainLayout><SellerDashboard /></MainLayout>} />
                  <Route path="/seller/products" element={<MainLayout><SellerProducts addToCart={addToCart} /></MainLayout>} />
                  <Route path="/seller/orders" element={<MainLayout><SellerOrders /></MainLayout>} />
                  <Route path="/seller/payouts" element={<MainLayout><SellerPayouts /></MainLayout>} />
                  <Route path="/seller/profit-analytics" element={<MainLayout><SellerProfitAnalytics /></MainLayout>} />
                  <Route path="/seller/integrations" element={<MainLayout><SellerIntegrations /></MainLayout>} /> {/* ✅ جديد */}
                  <Route path="/seller/store-settings" element={<MainLayout><SellerStoreSettings /></MainLayout>} />


                </>
              )}

              {/* Admin Routes */}
              {isAdmin && (
                <>
                  <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
                  <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
                  <Route path="/customers" element={<MainLayout><Customers /></MainLayout>} />
                  <Route path="/invoices" element={<MainLayout><Invoices /></MainLayout>} />
                  <Route path="/invoices/new" element={<MainLayout><NewInvoice /></MainLayout>} />
                  <Route path="/admin-orders" element={<MainLayout><AdminOrders /></MainLayout>} />
                </>
              )}
            </>
          ) : (
            <>
              <Route path="/my-orders" element={<Navigate to="/shop" replace />} />
              <Route path="/wishlist" element={<Navigate to="/shop" replace />} />
              <Route path="/profile" element={<Navigate to="/shop" replace />} />
              <Route path="/design-studio" element={<Navigate to="/shop" replace />} />
              <Route path="/material-library" element={<Navigate to="/shop" replace />} />
              <Route path="/seller/*" element={<Navigate to="/shop" replace />} />
              <Route path="/dashboard" element={<Navigate to="/shop" replace />} />
              <Route path="/products" element={<Navigate to="/shop" replace />} />
              <Route path="/customers" element={<Navigate to="/shop" replace />} />
              <Route path="/invoices/*" element={<Navigate to="/shop" replace />} />
              <Route path="/admin-orders" element={<Navigate to="/shop" replace />} />
            </>
          )}

          <Route path="/login" element={<Navigate to="/shop" replace />} />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>

        <Toaster position="top-right" />

        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
              <button
                onClick={closeLoginModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
              <Login onLogin={handleLogin} />
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;