import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaHeart, FaTrash, FaShoppingCart } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

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
    await axios.delete(`${API_URL}/wishlist/${productId}`);
    toast.success('Removed from wishlist');
    fetchWishlist();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl"><FaHeart className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Your wishlist is empty</p><Link to="/shop" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">Start Shopping</Link></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(product => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Link to={`/product/${product.slug}`}><img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" /></Link>
              <div className="p-4"><Link to={`/product/${product.slug}`}><h3 className="font-semibold text-lg">{product.name}</h3></Link><p className="text-blue-600 font-bold mt-1">{product.price.toLocaleString()} EGP</p>
              <div className="flex gap-2 mt-3"><button onClick={() => addToCart(product)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"><FaShoppingCart /> Add to Cart</button><button onClick={() => removeFromWishlist(product._id)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg"><FaTrash /></button></div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;