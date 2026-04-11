import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, FaBox, FaUsers, FaFileInvoice, FaSignOutAlt, FaUser, 
  FaShoppingCart, FaTruck, FaStore, FaListAlt, FaMoneyBillWave,
  FaStoreAlt, FaHeart, FaCog, FaChartLine, FaNewspaper,
  FaSignInAlt,FaComments
} from 'react-icons/fa';

const Navbar = ({ user, onLogout, onLogin, cartCount }) => {
  const location = useLocation();

  // روابط عامة (تظهر للجميع - حتى غير المسجلين)
  const publicNavItems = [
    { path: '/shop', label: 'Marketplace', icon: <FaStoreAlt /> },
    { path: '/track-order', label: 'Track Order', icon: <FaTruck /> },
  ];

  // روابط خاصة (تظهر فقط للمستخدمين المسجلين)
  const privateNavItems = [
    { path: '/', label: 'Home', icon: <FaHome /> },
    { path: '/feed', label: 'Feed', icon: <FaNewspaper /> },
    { path: '/chat', label: 'Messages', icon: <FaComments /> },

    { path: '/my-orders', label: 'My Orders', icon: <FaListAlt /> },
  ];

  // روابط للمدير فقط (Admin)
  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaChartLine /> },
    { path: '/products', label: 'Products', icon: <FaBox /> },
    { path: '/customers', label: 'Customers', icon: <FaUsers /> },
    { path: '/invoices', label: 'Invoices', icon: <FaFileInvoice /> },
    { path: '/admin-orders', label: 'Orders Mgmt', icon: <FaListAlt /> },
    { path: '/design-studio', label: 'AI Design', icon: <FaCog /> },
    { path: '/material-library', label: 'Materials', icon: <FaBox /> },
  ];

  // روابط للبائع فقط (Seller)
  const sellerNavItems = [
    { path: '/seller/dashboard', label: 'Seller Hub', icon: <FaStore /> },
    { path: '/seller/products', label: 'My Products', icon: <FaBox /> },
    { path: '/seller/orders', label: 'Store Orders', icon: <FaListAlt /> },
    { path: '/seller/payouts', label: 'Payouts', icon: <FaMoneyBillWave /> },
    { path: '/seller/store-settings', label: 'Store Settings', icon: <FaCog /> },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo - للجميع */}
          <Link to={user ? "/" : "/shop"} className="flex items-center gap-2 group">
            <img 
              src="/logo-icon.svg" 
              alt="Naseej Logo" 
              className="w-10 h-10 transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <div className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Naseej
              </div>
              <p className="text-[10px] text-gray-400 -mt-1">MARKETPLACE</p>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex gap-4">
            {/* Public Links (تظهر للجميع) */}
            {publicNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Private Links (تظهر فقط للمستخدمين المسجلين) */}
            {user && privateNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Seller Links (if user is seller or admin) */}
            {user && (user?.role === 'seller' || user?.role === 'admin') && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
                  <FaStore /> My Store <FaCog className="text-xs" />
                </button>
                <div className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-lg w-48 py-2 z-50 hidden group-hover:block">
                  {sellerNavItems.map((item) => (
                    <Link key={item.path} to={item.path} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      {item.icon} {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Admin Links */}
            {user?.role === 'admin' && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
                  <FaCog /> Admin
                </button>
                <div className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-lg w-48 py-2 z-50 hidden group-hover:block">
                  {adminNavItems.map((item) => (
                    <Link key={item.path} to={item.path} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      {item.icon} {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Wishlist Icon (للمستخدمين فقط) */}
            {user && (
              <Link to="/wishlist" className="relative">
                <FaHeart className="text-gray-600 text-xl hover:text-red-500 transition" />
              </Link>
            )}
            
            {/* Cart Icon (للجميع) */}
            <Link to="/cart" className="relative">
              <FaShoppingCart className="text-gray-600 text-xl hover:text-blue-600 transition" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu / Login Button */}
            {user ? (
              <div className="relative group">
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white">
                    <FaUser size={14} />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>
                <div className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-lg w-48 py-2 z-50 hidden group-hover:block">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Profile</Link>
                  <Link to="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Wishlist</Link>
                  <hr className="my-1" />
                  {user?.role === 'seller' && (
                    <Link to="/seller/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Seller Dashboard</Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Panel</Link>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FaSignOutAlt className="inline mr-2" /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
              >
                <FaSignInAlt /> Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto gap-2 pb-2">
          {/* Public Links للجميع */}
          {publicNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition whitespace-nowrap ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          {/* Private Links للمستخدمين المسجلين فقط */}
          {user && privateNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition whitespace-nowrap ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          {user?.role === 'seller' && (
            <Link to="/seller/dashboard" className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm text-gray-600 whitespace-nowrap">
              <FaStore /> Seller
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;