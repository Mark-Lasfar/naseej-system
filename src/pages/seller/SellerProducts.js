import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaUpload, FaVideo, 
  FaTimes, FaImage, FaCloudUploadAlt, FaLink, FaYoutube,
  FaGripVertical, FaCheck, FaSpinner, FaCloud, FaTrashAlt
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

// دالة ضغط الصور المحسنة
const compressImageFile = async (file) => {
  const options = {
    maxSizeMB: 0.5,        // الحد الأقصى للحجم بعد الضغط (0.5 MB)
    maxWidthOrHeight: 1200, // الحد الأقصى للبعد
    useWebWorker: true,     // استخدام Web Worker للسرعة
    fileType: 'image/jpeg', // تحويل إلى JPEG
    quality: 0.7            // جودة 70%
  };
  
  try {
    // إذا كان حجم الملف أقل من 500KB، لا نضغطه
    if (file.size < 500 * 1024) {
      console.log(`📦 ملف صغير: ${(file.size / 1024).toFixed(0)}KB, لن يتم ضغطه`);
      return file;
    }
    
    const compressedFile = await imageCompression(file, options);
    const savedPercent = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
    console.log(`✅ ضغط: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (توفير ${savedPercent}%)`);
    
    return compressedFile;
  } catch (error) {
    console.error('❌ خطأ في ضغط الصورة:', error);
    return file; // إرجاع الملف الأصلي في حالة الخطأ
  }
};

// دالة فحص الفيديو
const validateVideoFile = async (file) => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    toast.error(`حجم الفيديو كبير جداً (${(file.size / 1024 / 1024).toFixed(2)}MB). الحد الأقصى 20MB`);
    return null;
  }
  return file;
};

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '', category: 'carpet', subcategory: '', material: '', size: '', color: '',
    price: '', oldPrice: '', quantity: '', imageUrl: '', images: [], videoUrl: '',
    description: '', features: [], tags: [], discount: 0
  });
  const [featuresInput, setFeaturesInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/seller/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // دالة رفع الملفات مع ضغط الصور
  const uploadFiles = async (files, type = 'image') => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const uploadedUrls = [];
    const uploadedData = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let compressedCount = 0;

    for (const file of files) {
      let fileToUpload = file;
      totalOriginalSize += file.size;
      
      // ضغط الصور فقط
      if (type === 'image' && file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file);
        if (compressed) {
          fileToUpload = compressed;
          totalCompressedSize += compressed.size;
          if (compressed.size < file.size) compressedCount++;
        }
      } else if (type === 'video') {
        const validated = await validateVideoFile(file);
        if (!validated) {
          setUploading(false);
          return;
        }
      }
      
      const formDataFile = new FormData();
      const endpoint = type === 'video' ? '/upload/video' : '/upload';
      formDataFile.append(type, fileToUpload);

      try {
        const response = await axios.post(`${API_URL}${endpoint}`, formDataFile, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [file.name]: percent }));
          }
        });

        if (type === 'video') {
          setFormData(prev => ({ ...prev, videoUrl: response.data.url }));
          toast.success('✅ Video uploaded successfully');
        } else {
          uploadedUrls.push(response.data.url);
          uploadedData.push(response.data);
        }
      } catch (error) {
        toast.error(`Failed to upload ${file.name}: ${error.response?.data?.error || error.message}`);
      }
    }
    
    // إظهار ملخص الضغط
    if (compressedCount > 0) {
      const savedMB = ((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2);
      toast.success(`💪 تم ضغط ${compressedCount} صورة، وفرنا ${savedMB}MB!`);
    }

    if (uploadedUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      
      setImagePreviews(prev => [
        ...prev,
        ...uploadedUrls.map(url => url)
      ]);
      
      setUploadedFiles(prev => [...prev, ...uploadedData]);
      toast.success(`✅ تم رفع ${uploadedUrls.length} صورة بنجاح`);
    }

    setUploading(false);
    setUploadProgress({});
  };

  const deleteImage = async (imageUrl, index) => {
    try {
      // استخراج publicId من رابط Cloudinary
      const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
      await axios.delete(`${API_URL}/upload/${publicId}`);
      
      const newImages = [...formData.images];
      newImages.splice(index, 1);
      setFormData({ ...formData, images: newImages });
      
      const newPreviews = [...imagePreviews];
      newPreviews.splice(index, 1);
      setImagePreviews(newPreviews);
      
      toast.success('✅ Image deleted');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(file => {
        toast.error(`${file.file.name}: ${file.errors[0].message}`);
      });
    }
    
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    const videoFiles = acceptedFiles.filter(file => file.type.startsWith('video/'));
    
    if (imageFiles.length > 0) {
      uploadFiles(imageFiles, 'image');
    }
    if (videoFiles.length > 0) {
      uploadFiles(videoFiles, 'video');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.avif'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/seller/products/${editingProduct._id}`, formData);
        toast.success('Product updated');
      } else {
        await axios.post(`${API_URL}/seller/products`, formData);
        toast.success('Product created');
      }
      fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await axios.delete(`${API_URL}/seller/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', category: 'carpet', subcategory: '', material: '', size: '', color: '',
      price: '', oldPrice: '', quantity: '', imageUrl: '', images: [], videoUrl: '',
      description: '', features: [], tags: [], discount: 0 
    });
    setImagePreviews([]);
    setUploadedFiles([]);
    setEditingProduct(null);
    setActiveTab('basic');
  };

  const addFeature = () => {
    if (featuresInput.trim()) {
      setFormData({ ...formData, features: [...formData.features, featuresInput.trim()] });
      setFeaturesInput('');
    }
  };

  const removeFeature = (index) => {
    const newFeatures = [...formData.features];
    newFeatures.splice(index, 1);
    setFormData({ ...formData, features: newFeatures });
  };

  const addTag = () => {
    if (tagsInput.trim()) {
      setFormData({ ...formData, tags: [...formData.tags, tagsInput.trim()] });
      setTagsInput('');
    }
  };

  const removeTag = (index) => {
    const newTags = [...formData.tags];
    newTags.splice(index, 1);
    setFormData({ ...formData, tags: newTags });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <FaPlus /> Add Product
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Product</th>
              <th className="px-6 py-3 text-left">Price</th>
              <th className="px-6 py-3 text-left">Stock</th>
              <th className="px-6 py-3 text-left">Images</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.material}</p>
                  </div>
                </td>
                <td className="px-6 py-4">{p.price.toLocaleString()} EGP</td>
                <td className="px-6 py-4">{p.quantity}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {p.images?.slice(0, 3).map((img, idx) => (
                      <img key={idx} src={img} alt="" className="w-8 h-8 rounded object-cover" />
                    ))}
                    {(p.images?.length || 0) > 3 && (
                      <span className="text-xs text-gray-500">+{p.images.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {p.status || 'pending'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { 
                        setEditingProduct(p); 
                        setFormData(p); 
                        setImagePreviews(p.images || []); 
                        setShowModal(true); 
                      }} 
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-800">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="flex border-b px-6">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 font-medium transition ${activeTab === 'basic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('images')}
                className={`px-4 py-2 font-medium transition ${activeTab === 'images' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Media (Images & Video)
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  {/* Basic Info Fields - same as before */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Name *</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <select 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="carpet">Carpet</option>
                        <option value="textile">Textile</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subcategory</label>
                      <input 
                        type="text" 
                        value={formData.subcategory} 
                        onChange={e => setFormData({...formData, subcategory: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg" 
                        placeholder="e.g., Persian, Modern" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Material</label>
                      <input 
                        type="text" 
                        value={formData.material} 
                        onChange={e => setFormData({...formData, material: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg" 
                        placeholder="Wool, Silk, Cotton" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Size</label>
                      <input 
                        type="text" 
                        value={formData.size} 
                        onChange={e => setFormData({...formData, size: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg" 
                        placeholder="e.g., 2x3 m" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Price (EGP) *</label>
                      <input 
                        type="number" 
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Old Price</label>
                      <input 
                        type="number" 
                        value={formData.oldPrice} 
                        onChange={e => setFormData({...formData, oldPrice: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Discount %</label>
                      <input 
                        type="number" 
                        value={formData.discount} 
                        onChange={e => setFormData({...formData, discount: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantity *</label>
                      <input 
                        type="number" 
                        value={formData.quantity} 
                        onChange={e => setFormData({...formData, quantity: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Color</label>
                      <input 
                        type="text" 
                        value={formData.color} 
                        onChange={e => setFormData({...formData, color: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg" 
                        placeholder="Red, Blue, Beige" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg" 
                      rows="4" 
                      placeholder="Detailed description of the product..." 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Features</label>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={featuresInput} 
                        onChange={e => setFeaturesInput(e.target.value)} 
                        className="flex-1 px-3 py-2 border rounded-lg" 
                        placeholder="e.g., Handmade, Eco-friendly" 
                        onKeyPress={e => e.key === 'Enter' && addFeature()} 
                      />
                      <button type="button" onClick={addFeature} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((feature, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                          {feature}
                          <button type="button" onClick={() => removeFeature(idx)} className="hover:text-red-600">
                            <FaTimes size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={tagsInput} 
                        onChange={e => setTagsInput(e.target.value)} 
                        className="flex-1 px-3 py-2 border rounded-lg" 
                        placeholder="e.g., luxury, gift" 
                        onKeyPress={e => e.key === 'Enter' && addTag()} 
                      />
                      <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                          #{tag}
                          <button type="button" onClick={() => removeTag(idx)} className="hover:text-red-600">
                            <FaTimes size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <FaCloud className="text-blue-600" /> Upload Media (Images & Videos)
                    </label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <FaCloudUploadAlt className="text-5xl text-gray-400 mx-auto mb-3" />
                      {isDragActive ? (
                        <p className="text-blue-600">Drop your files here...</p>
                      ) : (
                        <>
                          <p className="text-gray-600 font-medium">Drag & drop images or videos here</p>
                          <p className="text-sm text-gray-400 mt-1">or click to select files</p>
                          <p className="text-xs text-gray-400 mt-2">Supports: JPG, PNG, GIF, WEBP, AVIF, MP4, WebM (Max 50MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {uploading && Object.keys(uploadProgress).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(uploadProgress).map(([name, progress]) => (
                        <div key={name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="truncate">{name}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 rounded-full h-2 transition-all" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {formData.videoUrl && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <FaVideo className="text-red-500" /> Product Video
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, videoUrl: '' })}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                      <video src={formData.videoUrl} controls className="w-full rounded-lg max-h-48" />
                    </div>
                  )}
                  
                  {imagePreviews.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <FaImage className="text-green-600" /> Images ({imagePreviews.length})
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={preview} 
                              alt={`Preview ${idx}`} 
                              className="w-full h-32 object-cover rounded-lg border shadow-sm" 
                            />
                            <button
                              type="button"
                              onClick={() => deleteImage(preview, idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-1">External Image URL (Optional)</label>
                    <input 
                      type="url" 
                      value={formData.imageUrl} 
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg" 
                      placeholder="https://example.com/image.jpg" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Alternative to drag & drop upload (external image link)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <FaYoutube className="text-red-500" /> YouTube or Vimeo URL
                    </label>
                    <input 
                      type="url" 
                      value={formData.videoUrl} 
                      onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg" 
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." 
                    />
                    <p className="text-xs text-gray-500 mt-1">Add a YouTube or Vimeo link (will override uploaded video)</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="submit" 
                  disabled={uploading} 
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading && <FaSpinner className="animate-spin" />}
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); resetForm(); }} 
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition"
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

export default SellerProducts;