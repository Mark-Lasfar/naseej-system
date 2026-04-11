import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaEdit, FaTrash, FaPlus, FaImage, FaTag, FaBox, FaDollarSign } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'carpet',
    subcategory: '',
    material: '',
    size: '',
    color: '',
    price: '',
    oldPrice: '',
    quantity: '',
    imageUrl: '',
    images: [],
    description: '',
    features: [],
    tags: [],
    isFeatured: false,
    isNew: false,
    discount: 0
  });
  const [featuresInput, setFeaturesInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // تجهيز البيانات
      const submitData = {
        ...formData,
        features: formData.features.filter(f => f.trim()),
        tags: formData.tags.filter(t => t.trim()),
        price: Number(formData.price),
        oldPrice: Number(formData.oldPrice) || 0,
        quantity: Number(formData.quantity),
        discount: Number(formData.discount) || 0
      };

      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct._id}`, submitData);
        toast.success('Product updated successfully.');
      } else {
        await axios.post(`${API_URL}/products`, submitData);
        toast.success('Product created successfully.');
      }
      fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
        toast.success('Product deleted successfully.');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'carpet',
      subcategory: '',
      material: '',
      size: '',
      color: '',
      price: '',
      oldPrice: '',
      quantity: '',
      imageUrl: '',
      images: [],
      description: '',
      features: [],
      tags: [],
      isFeatured: false,
      isNew: false,
      discount: 0
    });
    setFeaturesInput('');
    setTagsInput('');
    setEditingProduct(null);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      price: product.price,
      oldPrice: product.oldPrice || '',
      quantity: product.quantity,
      features: product.features || [],
      tags: product.tags || []
    });
    setFeaturesInput((product.features || []).join(', '));
    setTagsInput((product.tags || []).join(', '));
    setShowModal(true);
  };

  const addFeature = () => {
    if (featuresInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featuresInput.trim()]
      });
      setFeaturesInput('');
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const addTag = () => {
    if (tagsInput.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagsInput.trim().toLowerCase()]
      });
      setTagsInput('');
    }
  };

  const removeTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products Management</h1>
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FaPlus /> Add Product
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded" />}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.material} | {product.size} | {product.color}</p>
                        {product.isFeatured && <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Featured</span>}
                        {product.isNew && <span className="text-xs bg-green-100 text-green-800 px-1 rounded ml-1">New</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{product.slug}</td>
                  <td className="px-6 py-4 capitalize">{product.category} {product.subcategory && `(${product.subcategory})`}</td>
                  <td className="px-6 py-4">
                    {product.oldPrice > 0 ? (
                      <div>
                        <span className="font-bold text-blue-600">{product.price.toLocaleString()} EGP</span>
                        <span className="text-xs text-gray-400 line-through ml-1">{product.oldPrice.toLocaleString()} EGP</span>
                      </div>
                    ) : (
                      <span className="font-bold">{product.price.toLocaleString()} EGP</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.quantity < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {product.quantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.views || 0}</td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="text-red-600 hover:text-red-800">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Add/Edit Product */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (auto-generated)</label>
                  <input type="text" value={formData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')} className="w-full px-3 py-2 border rounded-lg bg-gray-100" disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="carpet">Carpet</option>
                    <option value="textile">Textile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subcategory</label>
                  <input type="text" value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} placeholder="e.g., wool, silk, cotton" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Material</label>
                  <input type="text" value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Size</label>
                  <input type="text" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} placeholder="e.g., 2x3m" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (EGP) *</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Old Price (EGP)</label>
                  <input type="number" value={formData.oldPrice} onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount %</label>
                  <input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity *</label>
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />
                    <span className="text-sm">Featured Product</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.isNew} onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })} />
                    <span className="text-sm">New Arrival</span>
                  </label>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-1">Main Image URL</label>
                <input type="url" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium mb-1">Features</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" placeholder="Add a feature" />
                  <button type="button" onClick={addFeature} className="px-4 py-2 bg-gray-200 rounded-lg">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      {feature}
                      <button type="button" onClick={() => removeFeature(idx)} className="text-red-500 hover:text-red-700">&times;</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-1">Tags (for search)</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" placeholder="Add a tag" />
                  <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-200 rounded-lg">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      #{tag}
                      <button type="button" onClick={() => removeTag(idx)} className="text-red-500 hover:text-red-700">&times;</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{editingProduct ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;