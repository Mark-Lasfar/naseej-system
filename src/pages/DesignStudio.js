import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  FaMagic, FaRulerCombined, FaPalette, FaLayerGroup,
  FaCube, FaDollarSign, FaClock, FaDownload, FaRobot,
  FaEye, FaSave, FaPrint, FaArrowLeft, FaSpinner, FaShoppingCart,
  FaCheckCircle, FaExclamationTriangle, FaWhatsapp,
  FaShare, FaHeart, FaRegHeart, FaUpload, FaImage,
  FaVideo, FaTrash, FaExpand, FaCompress, FaCode,
  FaIndustry, FaCog, FaWrench, FaFileAlt, FaFileCode,
  FaFileArchive, FaTachometerAlt, FaGem, FaStar, FaStarHalfAlt,
  FaPalette as FaPaletteIcon, FaBrush, FaRuler, FaWeightHanging,
  FaThermometerHalf, FaBoxes, FaTruck, FaShieldAlt, FaLink
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DesignStudio = ({ addToCart }) => {
  const navigate = useNavigate();
  
  // ================ State Variables ================
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('parameters');
  const [designsList, setDesignsList] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showGCode, setShowGCode] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('gcode');
  const [gcodeContent, setGcodeContent] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [favoriteDesigns, setFavoriteDesigns] = useState([]);
  const previewContainerRef = useRef(null);
  
  // ================ Design Inputs ================
  const [designInputs, setDesignInputs] = useState({
    dimensions: { width: 200, height: 300 },
    colors: {
      primary: '#8B4513',
      secondary: ['#D2691E', '#F5DEB3'],
      accent: ['#FFD700']
    },
    pattern: {
      type: 'geometric',
      complexity: 5
    },
    material: {
      type: 'wool',
      density: 'medium',
      thickness: 1.5
    },
    prompt: ''
  });

  // ================ Helper Functions ================
  const getPreviewUrl = () => {
    if (previewImage) return previewImage;
    if (design?.preview3D) return design.preview3D;
    if (design?.previewUrl) return design.previewUrl;
    if (design?.design?.previewUrl) return design.design.previewUrl;
    return null;
  };

  const previewUrl = getPreviewUrl();

  // ================ API Calls ================
  const fetchDesigns = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/designs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDesignsList(response.data.designs || []);
    } catch (error) {
      console.error('Failed to fetch designs:', error);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('favoriteDesigns');
    if (saved) {
      setFavoriteDesigns(JSON.parse(saved));
    }
  };

  // ================ useEffect ================
  useEffect(() => {
    fetchDesigns();
    loadFavorites();
  }, []);

  // ================ Core Functions ================
  const toggleFavorite = (designId) => {
    let newFavorites;
    if (favoriteDesigns.includes(designId)) {
      newFavorites = favoriteDesigns.filter(id => id !== designId);
      toast.success('Removed from favorites');
    } else {
      newFavorites = [...favoriteDesigns, designId];
      toast.success('Added to favorites');
    }
    setFavoriteDesigns(newFavorites);
    localStorage.setItem('favoriteDesigns', JSON.stringify(newFavorites));
  };

  const handleGenerateDesign = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to generate designs');
        navigate('/login');
        return;
      }

      const response = await axios.post(`${API_URL}/ai/generate-design`, designInputs, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Design response:', response.data);

      const previewUrl = response.data.preview3D || response.data.design?.previewUrl;

      setDesign(response.data);
      setPreviewImage(previewUrl);

      if (response.data.gcode) {
        setGcodeContent(response.data.gcode);
      }

      if (!previewUrl) {
        toast.warning('Design generated successfully! Preview image not available, but G-Code is ready for machine production.');
      } else {
        toast.success('AI design generated successfully! Realistic carpet preview ready.');
      }

      fetchDesigns();
    } catch (error) {
      console.error('Generate error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate design');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = async () => {
    if (!design) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/designs/${design.design?._id || design._id}/status`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Design saved successfully!');
      fetchDesigns();
    } catch (error) {
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToProducts = async () => {
    if (!design) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const designId = design.design?._id || design._id;
      const response = await axios.post(`${API_URL}/designs/${designId}/save-to-products`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Design saved as product! Ready for sale in your store.');
      if (response.data.product) {
        setTimeout(() => {
          navigate(`/product/${response.data.product.slug}`);
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save as product');
    } finally {
      setSaving(false);
    }
  };

  // ================ Add to Cart Function (Fixed) ================
  const handleAddToCart = () => {
    if (!design) {
      toast.error('No design to add to cart');
      return;
    }
    
    const designId = design.design?._id || design._id;
    const designData = design.design || design;
    
    const cartItem = {
      id: designId,
      productId: designId,
      name: `AI Carpet Design - ${designData.dimensions?.width}x${designData.dimensions?.height}cm`,
      price: design.costEstimate?.total || 0,
      quantity: 1,
      imageUrl: previewUrl || design.preview3D || design.previewUrl,
      isCustomDesign: true,
      gcode: gcodeContent,
      material: designData.material?.type,
      pattern: designData.pattern?.type,
      complexity: designData.pattern?.complexity
    };
    
    if (addToCart) {
      addToCart(cartItem);
      toast.success('Custom design added to cart!');
    } else {
      // If addToCart prop is not provided, save to localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(existingCart));
      toast.success('Design added to cart!');
    }
  };

  const handleSendToMachine = async () => {
    if (!design) return;
    try {
      const token = localStorage.getItem('token');
      const designId = design.design?._id || design._id;

      toast.loading('Preparing G-Code for machine...', { id: 'machine-send' });

      // Simulate sending to machine
      setTimeout(() => {
        toast.success(`Design sent to machine in ${selectedFormat.toUpperCase()} format! The machine will start production.`, { id: 'machine-send' });
      }, 1500);

    } catch (error) {
      toast.error('Failed to send to machine', { id: 'machine-send' });
    }
  };

  // ================ Download Functions ================
  const handleDownloadDesign = async (format) => {
    if (!design) {
      toast.error('No design to download');
      return;
    }

    const designId = design.design?._id || design._id;
    if (!designId) {
      toast.error('Invalid design ID');
      return;
    }

    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to download designs');
        navigate('/login');
        return;
      }

      const downloadUrl = `${API_URL}/designs/${designId}/download/${format}`;
      const response = await fetch(downloadUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const formats = {
        gcode: { ext: 'gcode', name: 'G-Code' },
        python: { ext: 'py', name: 'Python' },
        dst: { ext: 'dst', name: 'DST' },
        emb: { ext: 'emb', name: 'EMB' }
      };

      const formatInfo = formats[format] || { ext: format, name: format.toUpperCase() };
      a.download = `carpet_design_${designId}_${formatInfo.name}.${formatInfo.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Design exported as ${formatInfo.name} successfully!`);

    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()}: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadGCode = () => {
    if (!gcodeContent) {
      toast.error('No G-Code available. Please generate a design first.');
      return;
    }

    const blob = new Blob([gcodeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design_${design?.design?._id || design?._id || Date.now()}.${selectedFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Design exported as ${selectedFormat.toUpperCase()}`);
  };

  const handleDownloadHighResImage = async () => {
    if (!design) return;
    
    const designId = design.design?._id || design._id;
    const token = localStorage.getItem('token');
    
    setDownloading(true);
    try {
      const response = await fetch(`${API_URL}/designs/${designId}/image`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to download image');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carpet_design_${designId}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('High-resolution carpet image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!previewUrl) {
      toast.error('No preview image available');
      return;
    }

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carpet_preview_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Preview image downloaded');
    } catch (error) {
      toast.error('Failed to download preview');
    }
  };

  const handleDownloadAllFormats = async () => {
    if (!design) {
      toast.error('No design to download');
      return;
    }

    setDownloading(true);
    const formats = ['gcode', 'python', 'dst', 'emb'];
    
    toast.loading('Preparing all formats for download...', { id: 'download-all' });

    for (const format of formats) {
      try {
        const designId = design.design?._id || design._id;
        const token = localStorage.getItem('token');
        const downloadUrl = `${API_URL}/designs/${designId}/download/${format}`;

        const response = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `carpet_design_${designId}.${format === 'python' ? 'py' : format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to download ${format}:`, error);
      }
    }

    toast.success('All formats downloaded successfully!', { id: 'download-all' });
    setDownloading(false);
  };

  const handleCopyPreviewLink = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
      toast.success('Preview link copied to clipboard');
    } else {
      toast.error('No preview available');
    }
  };

  // ================ UI Functions ================
  const toggleFullscreen = () => {
    try {
      const elem = previewContainerRef.current;
      if (!elem) return;
      
      if (!isFullscreen) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('Fullscreen mode error');
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handlePrint = () => window.print();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My AI Carpet Design',
        text: 'Check out this custom carpet design I created with Naseej AI!',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleWhatsAppShare = () => {
    const message = `🎨 Check out my custom carpet design from Naseej AI!\n\nDimensions: ${design?.design?.dimensions?.width || design?.dimensions?.width}x${design?.design?.dimensions?.height || design?.dimensions?.height} cm\nMaterial: ${design?.design?.material?.type || design?.material?.type}\nTotal Cost: ${design?.costEstimate?.total?.toLocaleString() || 0} EGP\n\nCreated with Naseej AI Design Studio`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setPreviewImage(response.data.url);
      toast.success('Reference image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const loadDesign = (savedDesign) => {
    setSelectedDesign(savedDesign);
    setDesign({
      design: savedDesign,
      costEstimate: savedDesign.costEstimate,
      productionTime: savedDesign.productionTime,
      preview3D: savedDesign.previewUrl,
      gcode: savedDesign.gcode
    });
    setPreviewImage(savedDesign.previewUrl);
    setGcodeContent(savedDesign.gcode || '');
    setDesignInputs({
      dimensions: savedDesign.dimensions,
      colors: savedDesign.colors,
      pattern: savedDesign.pattern,
      material: savedDesign.material,
      prompt: savedDesign.aiPrompt || ''
    });
    setActiveTab('parameters');
    toast.success('Design loaded successfully');
  };

  const deleteDesign = async (designId) => {
    if (!window.confirm('Are you sure you want to delete this design?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/designs/${designId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Design deleted');
      fetchDesigns();
      if (selectedDesign?._id === designId) {
        setSelectedDesign(null);
        setDesign(null);
        setPreviewImage(null);
        setGcodeContent('');
      }
    } catch (error) {
      toast.error('Failed to delete design');
    }
  };

  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.style.display = 'none';
  };

  // ================ Options Data ================
  const materialOptions = [
    { value: 'wool', label: '🧶 Wool - Premium Quality', icon: '🧶', description: 'Soft, warm, durable', priceMultiplier: 1.0 },
    { value: 'silk', label: '✨ Silk - Luxury', icon: '✨', description: 'Shiny, smooth, elegant', priceMultiplier: 2.5 },
    { value: 'cotton', label: '🌿 Cotton - Soft', icon: '🌿', description: 'Breathable, natural, comfortable', priceMultiplier: 0.7 },
    { value: 'polyester', label: '🔧 Polyester - Durable', icon: '🔧', description: 'Strong, stain-resistant, affordable', priceMultiplier: 0.5 },
    { value: 'acrylic', label: '🎨 Acrylic - Versatile', icon: '🎨', description: 'Lightweight, colorfast', priceMultiplier: 0.6 },
    { value: 'jute', label: '🌾 Jute - Eco Friendly', icon: '🌾', description: 'Natural, biodegradable, rustic', priceMultiplier: 0.8 }
  ];

  const patternOptions = [
    { value: 'geometric', label: '🔷 Geometric', icon: '🔷', description: 'Islamic & Modern geometric patterns' },
    { value: 'floral', label: '🌸 Floral', icon: '🌸', description: 'Persian & Oriental floral designs' },
    { value: 'abstract', label: '🎨 Abstract', icon: '🎨', description: 'Contemporary & artistic' },
    { value: 'traditional', label: '🏛️ Traditional', icon: '🏛️', description: 'Classic & heritage patterns' }
  ];

  const densityOptions = [
    { value: 'low', label: 'Low Density (Budget)', knots: '100-150 knots/m²', time: 'Fast' },
    { value: 'medium', label: 'Medium Density (Standard)', knots: '200-300 knots/m²', time: 'Medium' },
    { value: 'high', label: 'High Density (Premium)', knots: '400-600 knots/m²', time: 'Slow' }
  ];

  // ================ Render ================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-white/80 hover:text-white transition">
                <FaArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                  <FaMagic className="text-yellow-400" />
                  AI Design Studio
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Powered by Advanced AI</span>
                </h1>
                <p className="text-white/80 text-sm mt-2">
                  Create unique, realistic carpet designs with AI and export to machine formats (G-Code, Python, DST, EMB)
                </p>
              </div>
            </div>

            <div className="flex gap-2 bg-white/10 p-1 rounded-xl backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('parameters')}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'parameters' ? 'bg-white text-blue-900 shadow-lg' : 'text-white/80 hover:text-white'
                }`}
              >
                <FaRobot /> New Design
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'library' ? 'bg-white text-blue-900 shadow-lg' : 'text-white/80 hover:text-white'
                }`}
              >
                <FaSave /> My Designs 
                {designsList.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {designsList.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'parameters' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaRobot /> Design Parameters
                </h2>
                <p className="text-white/80 text-sm">Customize your carpet design</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
                    <FaRulerCombined className="text-blue-600" /> Dimensions (cm)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Width</label>
                      <input
                        type="number"
                        value={designInputs.dimensions.width}
                        onChange={(e) => setDesignInputs({
                          ...designInputs,
                          dimensions: { ...designInputs.dimensions, width: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Height</label>
                      <input
                        type="number"
                        value={designInputs.dimensions.height}
                        onChange={(e) => setDesignInputs({
                          ...designInputs,
                          dimensions: { ...designInputs.dimensions, height: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Area: {(designInputs.dimensions.width * designInputs.dimensions.height / 10000).toFixed(2)} m²
                  </p>
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
                    <FaPalette className="text-purple-600" /> Color Palette
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Primary Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={designInputs.colors.primary}
                          onChange={(e) => setDesignInputs({
                            ...designInputs,
                            colors: { ...designInputs.colors, primary: e.target.value }
                          })}
                          className="w-16 h-12 rounded-lg border cursor-pointer"
                        />
                        <span className="text-sm font-mono">{designInputs.colors.primary}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Secondary Colors</label>
                      <div className="flex gap-2 flex-wrap">
                        {designInputs.colors.secondary.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const newSecondary = [...designInputs.colors.secondary];
                                newSecondary[idx] = e.target.value;
                                setDesignInputs({
                                  ...designInputs,
                                  colors: { ...designInputs.colors, secondary: newSecondary }
                                });
                              }}
                              className="w-12 h-10 rounded-lg border cursor-pointer"
                            />
                            {idx > 0 && (
                              <button
                                onClick={() => {
                                  const newSecondary = designInputs.colors.secondary.filter((_, i) => i !== idx);
                                  setDesignInputs({
                                    ...designInputs,
                                    colors: { ...designInputs.colors, secondary: newSecondary }
                                  });
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FaTrash size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setDesignInputs({
                            ...designInputs,
                            colors: { ...designInputs.colors, secondary: [...designInputs.colors.secondary, '#CCCCCC'] }
                          })}
                          className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition text-sm"
                        >
                          + Add Color
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pattern */}
                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
                    <FaLayerGroup className="text-green-600" /> Pattern Design
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {patternOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setDesignInputs({
                          ...designInputs,
                          pattern: { ...designInputs.pattern, type: option.value }
                        })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          designInputs.pattern.type === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-400">{option.description}</div>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Complexity Level</span>
                      <span className="font-bold text-blue-600">{designInputs.pattern.complexity}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={designInputs.pattern.complexity}
                      onChange={(e) => setDesignInputs({
                        ...designInputs,
                        pattern: { ...designInputs.pattern, complexity: parseInt(e.target.value) }
                      })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Material */}
                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
                    <FaGem className="text-amber-600" /> Material Selection
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {materialOptions.slice(0, 4).map(option => (
                      <button
                        key={option.value}
                        onClick={() => setDesignInputs({
                          ...designInputs,
                          material: { ...designInputs.material, type: option.value }
                        })}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          designInputs.material.type === option.value
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{option.icon}</div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-400">{option.description}</div>
                      </button>
                    ))}
                  </div>
                  <select
                    value={designInputs.material.density}
                    onChange={(e) => setDesignInputs({
                      ...designInputs,
                      material: { ...designInputs.material, density: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  >
                    {densityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* AI Prompt */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700">
                    <FaRobot className="text-purple-600" /> AI Prompt (Optional)
                  </label>
                  <textarea
                    value={designInputs.prompt}
                    onChange={(e) => setDesignInputs({ ...designInputs, prompt: e.target.value })}
                    placeholder="Describe your dream carpet design in detail... Example: 'Persian style with floral patterns in blue and gold, medallion center, intricate borders'"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    rows="3"
                  />
                </div>

                {/* Reference Image Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700">
                    <FaUpload className="text-green-600" /> Reference Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition cursor-pointer bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      {uploading ? (
                        <FaSpinner className="animate-spin mx-auto text-blue-500 text-3xl mb-2" />
                      ) : (
                        <>
                          <FaImage className="mx-auto text-gray-400 text-4xl mb-3" />
                          <p className="text-sm text-gray-500">Click or drag image to upload</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Machine Format Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
                    <FaCog className="text-orange-600" /> Machine Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'gcode', label: '📟 G-Code', desc: 'CNC Machines' },
                      { value: 'python', label: '🐍 Python', desc: 'Custom Controllers' },
                      { value: 'dst', label: '🪡 DST', desc: 'Tajima Embroidery' },
                      { value: 'emb', label: '💿 EMB', desc: 'Wilcom Embroidery' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedFormat(opt.value)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedFormat === opt.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs text-gray-400">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateDesign}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl flex items-center justify-center gap-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 shadow-lg text-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Generating Design & Machine Code...
                    </>
                  ) : (
                    <>
                      <FaMagic /> Generate AI Design
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Panel */}
            <div className="space-y-6">
              {design ? (
                <>
                  {/* Preview */}
                  <div ref={previewContainerRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FaCube className="text-blue-400" /> Realistic Carpet Preview
                      </h2>
                      <div className="flex gap-2">
                        <button onClick={handleZoomOut} className="text-white/70 hover:text-white">🔍-</button>
                        <span className="text-white/70 text-sm">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={handleZoomIn} className="text-white/70 hover:text-white">🔍+</button>
                        <button onClick={handleResetZoom} className="text-white/70 hover:text-white text-xs">Reset</button>
                        <button onClick={toggleFullscreen} className="text-white/70 hover:text-white">⛶</button>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 min-h-[400px] flex items-center justify-center overflow-auto p-4">
                      {previewUrl ? (
                        <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease' }}>
                          <img src={previewUrl} alt="Preview" className="max-w-full rounded-lg shadow-2xl" onError={handleImageError} style={{ maxHeight: '500px' }} />
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 p-12">
                          <FaCube size={64} className="mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Preview will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* G-Code Viewer Toggle */}
                  <button onClick={() => setShowGCode(!showGCode)} className="w-full bg-gray-800 text-white py-3 rounded-xl flex items-center justify-center gap-2">
                    <FaCode /> {showGCode ? 'Hide' : 'Show'} Generated {selectedFormat.toUpperCase()} Code
                  </button>

                  {showGCode && gcodeContent && (
                    <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
                      <div className="bg-gray-800 px-6 py-3 flex justify-between">
                        <h2 className="text-sm font-semibold text-green-400">{selectedFormat.toUpperCase()} Code</h2>
                        <button onClick={handleDownloadGCode} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg">Download</button>
                      </div>
                      <pre className="bg-gray-900 text-green-400 p-4 overflow-x-auto text-xs font-mono max-h-64">
                        {gcodeContent.length > 2000 ? gcodeContent.substring(0, 2000) + '\n\n... (truncated)' : gcodeContent}
                      </pre>
                    </div>
                  )}

                  {/* Cost Estimate */}
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                      <h2 className="text-lg font-semibold text-white">💰 Cost Estimate</h2>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between"><span>Materials:</span><span>{design.costEstimate?.materials?.toLocaleString() || 0} EGP</span></div>
                      <div className="flex justify-between"><span>Labor:</span><span>{design.costEstimate?.labor?.toLocaleString() || 0} EGP</span></div>
                      <div className="flex justify-between pt-3 font-bold text-xl"><span>Total:</span><span className="text-green-600">{design.costEstimate?.total?.toLocaleString() || 0} EGP</span></div>
                      <div className="flex justify-between text-sm"><span><FaClock className="inline" /> Production:</span><span>{design.productionTime || 0} hours</span></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">🏭 Production & Export</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleSaveDesign} disabled={saving} className="bg-blue-600 text-white py-3 rounded-xl"><FaSave /> {saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={handleSaveToProducts} disabled={saving} className="bg-purple-600 text-white py-3 rounded-xl"><FaCheckCircle /> Save as Product</button>
                      <button onClick={() => handleDownloadDesign(selectedFormat)} disabled={downloading} className="bg-green-600 text-white py-3 rounded-xl"><FaDownload /> Download</button>
                      <button onClick={handleDownloadHighResImage} disabled={downloading} className="bg-indigo-600 text-white py-3 rounded-xl"><FaImage /> High-Res</button>
                      <button onClick={handleDownloadAllFormats} disabled={downloading} className="bg-orange-600 text-white py-3 rounded-xl"><FaFileArchive /> All Formats</button>
                      <button onClick={handleSendToMachine} className="bg-red-600 text-white py-3 rounded-xl"><FaWrench /> Send to Machine</button>
                      {/* ✅ Fixed handleAddToCart button */}
                      <button onClick={handleAddToCart} className="bg-emerald-600 text-white py-3 rounded-xl col-span-2"><FaShoppingCart /> Add to Cart</button>
                    </div>
                    <div className="flex gap-3 mt-4 pt-4 border-t">
                      <button onClick={handleShare} className="flex-1 bg-gray-100 py-2 rounded-xl"><FaShare /> Share</button>
                      <button onClick={handleWhatsAppShare} className="flex-1 bg-green-500 text-white py-2 rounded-xl"><FaWhatsapp /> WhatsApp</button>
                      <button onClick={handlePrint} className="flex-1 bg-gray-100 py-2 rounded-xl"><FaPrint /> Print</button>
                      <button onClick={handleCopyPreviewLink} className="flex-1 bg-gray-100 py-2 rounded-xl"><FaLink /> Copy Link</button>
                    </div>
                  </div>

                  {/* Design Details */}
                  <div className="bg-gray-50 rounded-2xl p-5 border">
                    <p className="text-sm font-medium">Design ID: {(design.design?._id || design._id)?.slice(-12)}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                      <span>Area: {(design.design?.dimensions?.width * design.design?.dimensions?.height / 10000 || 0).toFixed(2)} m²</span>
                      <span>Pattern: {design.design?.pattern?.type || 'N/A'}</span>
                      <span>Complexity: {design.design?.pattern?.complexity || 0}/10</span>
                      <span>G-Code: {gcodeContent ? '✅ Ready' : '❌ Not Generated'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <FaMagic size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-2xl font-semibold mb-3">No Design Yet</h3>
                  <p className="text-gray-500">Adjust parameters and click "Generate AI Design" to create your carpet design.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* My Designs Library */
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">📁 My Saved Designs ({designsList.length})</h2>
            </div>
            <div className="p-6">
              {designsList.length === 0 ? (
                <div className="text-center py-12">
                  <FaMagic size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No saved designs yet</p>
                  <button onClick={() => setActiveTab('parameters')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl">Create New Design</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designsList.map((savedDesign) => (
                    <div key={savedDesign._id} className="border rounded-xl overflow-hidden hover:shadow-lg transition">
                      <div className="h-40 bg-gray-100 relative">
                        {savedDesign.previewUrl ? (
                          <img src={savedDesign.previewUrl} alt={savedDesign.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full"><FaCube size={40} className="text-gray-300" /></div>
                        )}
                        {savedDesign.gcode && <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">G-Code</span>}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold">{savedDesign.name}</h3>
                        <p className="text-sm text-gray-500">{savedDesign.dimensions?.width}x{savedDesign.dimensions?.height} cm</p>
                        <div className="flex justify-between mt-3">
                          <span className="text-blue-600 font-bold">{savedDesign.costEstimate?.total?.toLocaleString() || 0} EGP</span>
                          <div className="flex gap-2">
                            <button onClick={() => loadDesign(savedDesign)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">Load</button>
                            <button onClick={() => deleteDesign(savedDesign._id)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg">Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignStudio;