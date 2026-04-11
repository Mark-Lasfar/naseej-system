import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaStore, FaEdit, FaSave, FaPlusCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingStore, setCreatingStore] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', phone: '', address: '' });
  const [newStoreData, setNewStoreData] = useState({ name: '', description: '', logo: '', phone: '', email: '', address: '', city: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userRes = await axios.get(`${API_URL}/auth/me`);
      setUser(userRes.data);
      setFormData({ username: userRes.data.username, phone: userRes.data.phone || '', address: userRes.data.address || '' });
      
      try {
        const storeRes = await axios.get(`${API_URL}/seller/store`);
        setStore(storeRes.data);
      } catch (err) {
        // User doesn't have a store yet
        console.log('No store found');
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/auth/profile`, formData);
      toast.success('Profile updated');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const createStore = async (e) => {
    e.preventDefault();
    if (!newStoreData.name.trim()) {
      toast.error('Store name is required');
      return;
    }
    
    setCreatingStore(true);
    try {
      const storeData = {
        name: newStoreData.name,
        description: newStoreData.description,
        logo: newStoreData.logo,
        contact: {
          phone: newStoreData.phone,
          email: newStoreData.email || user?.email,
          address: newStoreData.address,
          city: newStoreData.city
        }
      };
      
      await axios.post(`${API_URL}/stores`, storeData);
      toast.success('Store created successfully!');
      setShowStoreForm(false);
      setNewStoreData({ name: '', description: '', logo: '', phone: '', email: '', address: '', city: '' });
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create store');
    } finally {
      setCreatingStore(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.username}</h2>
              <p className="opacity-80">{user?.email}</p>
              <p className="text-sm mt-1 capitalize">Role: {user?.role}</p>
            </div>
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><FaEdit /> Edit</button>
            ) : (
              <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
            )}
          </div>
          
          {!editing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2"><FaUser className="text-gray-400 w-5" /> {user?.username}</div>
              <div className="flex items-center gap-2"><FaEnvelope className="text-gray-400 w-5" /> {user?.email}</div>
              <div className="flex items-center gap-2"><FaPhone className="text-gray-400 w-5" /> {user?.phone || 'Not provided'}</div>
              <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-gray-400 w-5" /> {user?.address || 'Not provided'}</div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-3">
              <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaSave /> Save Changes</button>
            </form>
          )}
        </div>
        
        {/* Store Section */}
        <div className="border-t p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaStore /> My Store</h3>
          {store ? (
            <div>
              {store.logo && (
                <img src={store.logo} alt={store.name} className="w-24 h-24 object-cover rounded-lg mb-3" />
              )}
              <p className="font-medium text-lg">{store.name}</p>
              <p className="text-sm text-gray-500 mt-1">{store.description || 'No description'}</p>
              {store.contact?.phone && (
                <p className="text-sm text-gray-500 mt-1">📞 {store.contact.phone}</p>
              )}
              <div className="flex gap-3 mt-4">
                <Link to={`/shop/${store.slug}`} className="text-blue-600 hover:text-blue-800">View Store →</Link>
                <Link to="/seller/dashboard" className="text-green-600 hover:text-green-800">Seller Dashboard →</Link>
                <Link to="/seller/store-settings" className="text-purple-600 hover:text-purple-800">Store Settings →</Link>
              </div>
            </div>
          ) : (
            <div>
              {!showStoreForm ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">You don't have a store yet.</p>
                  <button 
                    onClick={() => setShowStoreForm(true)} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-700 transition"
                  >
                    <FaPlusCircle /> Open a Store
                  </button>
                </div>
              ) : (
                <form onSubmit={createStore} className="space-y-3 border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3">Create Your Store</h4>
                  <input 
                    type="text" 
                    placeholder="Store Name *" 
                    value={newStoreData.name} 
                    onChange={e => setNewStoreData({...newStoreData, name: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    required 
                  />
                  <textarea 
                    placeholder="Store Description" 
                    value={newStoreData.description} 
                    onChange={e => setNewStoreData({...newStoreData, description: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    rows="3"
                  />
                  <input 
                    type="url" 
                    placeholder="Logo URL" 
                    value={newStoreData.logo} 
                    onChange={e => setNewStoreData({...newStoreData, logo: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    value={newStoreData.phone} 
                    onChange={e => setNewStoreData({...newStoreData, phone: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                  <input 
                    type="text" 
                    placeholder="Address" 
                    value={newStoreData.address} 
                    onChange={e => setNewStoreData({...newStoreData, address: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                  <input 
                    type="text" 
                    placeholder="City" 
                    value={newStoreData.city} 
                    onChange={e => setNewStoreData({...newStoreData, city: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={creatingStore} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                      {creatingStore ? 'Creating...' : 'Create Store'}
                    </button>
                    <button type="button" onClick={() => setShowStoreForm(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;