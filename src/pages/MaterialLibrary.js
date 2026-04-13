import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaTimes,
  FaBox, FaDollarSign, FaStore, FaStar, FaRegStar,
  FaImage, FaSpinner, FaArrowLeft, FaEye, FaChartLine,
  FaWarehouse, FaTruck, FaCheckCircle
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MaterialLibrary = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'wool',
    supplier: '',
    pricePerKg: '',
    availableColors: [],
    availableQuantities: '',
    thickness: 1.5,
    weight: 2.5,
    durability: 5,
    softness: 5,
    imageUrl: ''
  });
  const [colorInput, setColorInput] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchMaterials();
    fetchStats();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [searchTerm, categoryFilter, materials]);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API_URL}/materials`);
      setMaterials(response.data.materials || response.data);
      setFilteredMaterials(response.data.materials || response.data);
    } catch (error) {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/materials/stats/summary`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filterMaterials = () => {
    let filtered = [...materials];
    
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }
    
    setFilteredMaterials(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await axios.put(`${API_URL}/materials/${editingMaterial._id}`, formData);
        toast.success('Material updated successfully');
      } else {
        await axios.post(`${API_URL}/materials`, formData);
        toast.success('Material added successfully');
      }
      fetchMaterials();
      fetchStats();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await axios.delete(`${API_URL}/materials/${id}`);
        toast.success('Material deleted successfully');
        fetchMaterials();
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete material');
      }
    }
  };

  const addColor = () => {
    if (colorInput.trim()) {
      setFormData({
        ...formData,
        availableColors: [...formData.availableColors, colorInput.trim()]
      });
      setColorInput('');
    }
  };

  const removeColor = (index) => {
    const newColors = [...formData.availableColors];
    newColors.splice(index, 1);
    setFormData({ ...formData, availableColors: newColors });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'wool',
      supplier: '',
      pricePerKg: '',
      availableColors: [],
      availableQuantities: '',
      thickness: 1.5,
      weight: 2.5,
      durability: 5,
      softness: 5,
      imageUrl: ''
    });
    setEditingMaterial(null);
  };

  const getCategoryBadge = (category) => {
    const badges = {
      wool: 'bg-amber-100 text-amber-800',
      silk: 'bg-pink-100 text-pink-800',
      cotton: 'bg-blue-100 text-blue-800',
      polyester: 'bg-gray-100 text-gray-800',
      blend: 'bg-purple-100 text-purple-800'
    };
    return badges[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      wool: '🧶',
      silk: '✨',
      cotton: '🌿',
      polyester: '🔧',
      blend: '🎨'
    };
    return icons[category] || '📦';
  };

  const renderStars = (value) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= value ? 
          <FaStar key={i} className="text-yellow-400 text-sm" /> : 
          <FaRegStar key={i} className="text-gray-300 text-sm" />
      );
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-600 hover:text-gray-800 transition">
            <FaArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📚 Material Library
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage fabrics, yarns, and materials for carpet production</p>
          </div>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-gray-100 rounded-xl flex items-center gap-2 hover:bg-gray-200 transition"
        >
          <FaChartLine /> {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
      </div>

      {/* Statistics Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <FaBox className="text-2xl mb-2 opacity-80" />
            <p className="text-2xl font-bold">{stats.totalMaterials}</p>
            <p className="text-xs opacity-80">Total Materials</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <FaCheckCircle className="text-2xl mb-2 opacity-80" />
            <p className="text-2xl font-bold">{stats.activeMaterials}</p>
            <p className="text-xs opacity-80">Active Materials</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <FaWarehouse className="text-2xl mb-2 opacity-80" />
            <p className="text-2xl font-bold">{stats.lowStockMaterials}</p>
            <p className="text-xs opacity-80">Low Stock</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <FaDollarSign className="text-2xl mb-2 opacity-80" />
            <p className="text-2xl font-bold">{stats.totalInventoryValue?.toLocaleString()} EGP</p>
            <p className="text-xs opacity-80">Inventory Value</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials by name or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="wool">🧶 Wool</option>
            <option value="silk">✨ Silk</option>
            <option value="cotton">🌿 Cotton</option>
            <option value="polyester">🔧 Polyester</option>
            <option value="blend">🎨 Blend</option>
          </select>
          {isAdmin && (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition"
            >
              <FaPlus /> Add Material
            </button>
          )}
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FaBox size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Materials Found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div 
              key={material._id} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
              onClick={() => setSelectedMaterial(selectedMaterial?._id === material._id ? null : material)}
            >
              {/* Image */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                {material.imageUrl ? (
                  <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="text-center">
                    <div className="text-5xl mb-1">{getCategoryIcon(material.category)}</div>
                    <FaImage size={32} className="text-gray-300 mx-auto" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(material.category)}`}>
                    {material.category}
                  </span>
                </div>
                {material.availableQuantities < 100 && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                      Low Stock
                    </span>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{material.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FaStore size={12} /> {material.supplier}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{material.pricePerKg?.toLocaleString()} EGP</p>
                    <p className="text-xs text-gray-400">per kg</p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <FaWarehouse className="text-gray-400" />
                    <span>{material.availableQuantities?.toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaTruck className="text-gray-400" />
                    <span>{material.thickness} cm</span>
                  </div>
                </div>
                
                {/* Ratings */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Durability</span>
                    <div className="flex gap-0.5">{renderStars(material.durability)}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Softness</span>
                    <div className="flex gap-0.5">{renderStars(material.softness)}</div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {selectedMaterial?._id === material._id && (
                  <div className="mt-4 pt-3 border-t animate-fade-in">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Weight</p>
                        <p className="font-medium">{material.weight} kg/m²</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Thickness</p>
                        <p className="font-medium">{material.thickness} cm</p>
                      </div>
                    </div>
                    {material.availableColors?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Available Colors:</p>
                        <div className="flex flex-wrap gap-1">
                          {material.availableColors.map((color, idx) => (
                            <span key={idx} className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: color }} title={color}></span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Actions */}
                {isAdmin && (
                  <div className="mt-4 pt-3 border-t flex justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingMaterial(material); setFormData(material); setShowModal(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(material._id); }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingMaterial ? 'Edit Material' : 'Add New Material'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                >
                  <option value="wool">🧶 Wool</option>
                  <option value="silk">✨ Silk</option>
                  <option value="cotton">🌿 Cotton</option>
                  <option value="polyester">🔧 Polyester</option>
                  <option value="blend">🎨 Blend</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Price/kg (EGP)</label>
                  <input
                    type="number"
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    value={formData.availableQuantities}
                    onChange={(e) => setFormData({ ...formData, availableQuantities: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Available Colors</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl"
                    placeholder="#HEX or color name"
                  />
                  <button type="button" onClick={addColor} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.availableColors.map((color, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                      {color}
                      <button type="button" onClick={() => removeColor(idx)} className="text-red-500 hover:text-red-700">
                        <FaTimes size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Durability (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.durability}
                    onChange={(e) => setFormData({ ...formData, durability: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-center text-sm">{formData.durability}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Softness (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.softness}
                    onChange={(e) => setFormData({ ...formData, softness: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-center text-sm">{formData.softness}</div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  placeholder="https://example.com/material-image.jpg"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition">
                  {editingMaterial ? 'Update' : 'Add'} Material
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 bg-gray-200 py-2 rounded-xl hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialLibrary;