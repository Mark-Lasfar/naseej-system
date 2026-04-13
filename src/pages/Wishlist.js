import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaHeart, FaTrash, FaShoppingCart, FaStar, FaRegStar, FaRegHeart } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const Wishlist = ({ addToCart }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWishlist(); }, []);

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(`${API_URL}/wishlist`);
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally { setLoading(false); }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await axios.delete(`${API_URL}/wishlist/${productId}`);
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
      storeId: product.storeId
    });
    toast.success(`${product.name} added to cart!`);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400 text-sm" />);
    }
    for (let i = fullStars; i < 5; i++) {
      stars.push(<FaRegStar key={i} className="text-yellow-400 text-sm" />);
    }
    return stars;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <FaHeart className="text-red-500" /> My Wishlist
            <span className="text-base font-normal text-gray-500">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Products you've saved for later</p>
        </div>
        <Link 
          to="/shop" 
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm transition"
        >
          Continue Shopping →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4">❤️</div>
          <FaHeart className="text-6xl text-gray-300 mx-auto mb-4 hidden" />
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save your favorite items here to buy them later</p>
          <Link 
            to="/shop" 
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map(product => (
              <div key={product._id} className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Product Image */}
                <Link to={`/product/${product.slug}`} className="block relative overflow-hidden bg-gray-100">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Discount Badge */}
                  {product.discount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      -{product.discount}%
                    </span>
                  )}
                </Link>
                
                {/* Product Info */}
                <div className="p-3 sm:p-4">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(product.rating)}
                    <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
                  </div>
                  
                  {/* Title */}
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-semibold text-sm sm:text-base line-clamp-1 hover:text-blue-600 transition">
                      {product.name}
                    </h3>
                  </Link>
                  
                  {/* Details */}
                  {product.material && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-1">{product.material}</p>
                  )}
                  
                  {/* Price */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-base sm:text-lg font-bold text-blue-600">
                      {product.price.toLocaleString()} EGP
                    </span>
                    {product.oldPrice > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        {product.oldPrice.toLocaleString()} EGP
                      </span>
                    )}
                  </div>
                  
                  {/* Stock Status */}
                  <div className={`text-xs mt-1 ${product.quantity < 10 ? 'text-red-500' : 'text-green-600'}`}>
                    {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => handleAddToCart(product)} 
                      disabled={product.quantity === 0}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaShoppingCart size={14} /> Add
                    </button>
                    <button 
                      onClick={() => removeFromWishlist(product._id)} 
                      className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                      title="Remove from wishlist"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Recommended Products Section (اختياري) */}
          {items.length >= 3 && (
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-xl font-bold mb-4">You might also like</h2>
              <p className="text-gray-500 text-sm">Check out more products from our marketplace</p>
              <Link 
                to="/shop" 
                className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Browse all products →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Wishlist;