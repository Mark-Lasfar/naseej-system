import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaMagic, FaRulerCombined, FaPalette, FaLayerGroup, 
  FaCube, FaDollarSign, FaClock, FaDownload, FaRobot,
  FaEye, FaSave, FaPrint, FaArrowLeft, FaSpinner,
  FaCheckCircle, FaExclamationTriangle, FaWhatsapp,
  FaShare, FaHeart, FaRegHeart
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const DesignStudio = ({ addToCart }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState(null);
  const [saving, setSaving] = useState(false);
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
      
      setDesign(response.data);
      toast.success('AI design generated successfully!');
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
      await axios.put(`${API_URL}/designs/${design.design._id}/status`, 
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Design saved successfully!');
    } catch (error) {
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = () => {
    if (!design) return;
    addToCart({
      productId: design.design._id,
      name: `Custom AI Design - ${design.design.dimensions.width}x${design.design.dimensions.height}`,
      price: design.costEstimate?.total || 0,
      quantity: 1,
      imageUrl: design.preview3D,
      isCustomDesign: true
    });
    toast.success('Custom design added to cart!');
  };

  const handleDownloadPDF = () => {
    toast.success('PDF download started (demo)');
    // في الإنتاج، يمكن إضافة رابط تحميل PDF حقيقي
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My AI Carpet Design',
        text: 'Check out this custom carpet design I created!',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleWhatsAppShare = () => {
    const message = `Check out my custom carpet design! Total cost: ${design?.costEstimate?.total || 0} EGP`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-gray-600 hover:text-gray-800 transition">
          <FaArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎨 AI Design Studio
          </h1>
          <p className="text-gray-500 mt-1">Create unique carpet designs powered by artificial intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaRobot className="text-blue-600" />
            Design Parameters
          </h2>
          
          {/* Dimensions */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FaRulerCombined className="text-gray-500" /> Dimensions (cm)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  value={designInputs.dimensions.width}
                  onChange={(e) => setDesignInputs({
                    ...designInputs,
                    dimensions: { ...designInputs.dimensions, width: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Width"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={designInputs.dimensions.height}
                  onChange={(e) => setDesignInputs({
                    ...designInputs,
                    dimensions: { ...designInputs.dimensions, height: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Height"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FaPalette className="text-gray-500" /> Colors
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Primary Color</label>
                <input
                  type="color"
                  value={designInputs.colors.primary}
                  onChange={(e) => setDesignInputs({
                    ...designInputs,
                    colors: { ...designInputs.colors, primary: e.target.value }
                  })}
                  className="w-full h-10 rounded-lg border cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Secondary Colors</label>
                <div className="flex gap-2 mt-1">
                  {designInputs.colors.secondary.map((color, idx) => (
                    <input
                      key={idx}
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
                      className="flex-1 h-10 rounded-lg border cursor-pointer"
                    />
                  ))}
                  <button
                    onClick={() => setDesignInputs({
                      ...designInputs,
                      colors: { ...designInputs.colors, secondary: [...designInputs.colors.secondary, '#CCCCCC'] }
                    })}
                    className="px-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pattern */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FaLayerGroup className="text-gray-500" /> Pattern
            </label>
            <select
              value={designInputs.pattern.type}
              onChange={(e) => setDesignInputs({
                ...designInputs,
                pattern: { ...designInputs.pattern, type: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500"
            >
              <option value="geometric">Geometric</option>
              <option value="floral">Floral</option>
              <option value="abstract">Abstract</option>
              <option value="traditional">Traditional</option>
            </select>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Simple</span>
              <input
                type="range"
                min="1"
                max="10"
                value={designInputs.pattern.complexity}
                onChange={(e) => setDesignInputs({
                  ...designInputs,
                  pattern: { ...designInputs.pattern, complexity: parseInt(e.target.value) }
                })}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">Complex</span>
            </div>
          </div>

          {/* Material */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Material</label>
            <select
              value={designInputs.material.type}
              onChange={(e) => setDesignInputs({
                ...designInputs,
                material: { ...designInputs.material, type: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500"
            >
              <option value="wool">Wool - Premium Quality</option>
              <option value="silk">Silk - Luxury</option>
              <option value="cotton">Cotton - Soft</option>
              <option value="polyester">Polyester - Durable</option>
            </select>
            <select
              value={designInputs.material.density}
              onChange={(e) => setDesignInputs({
                ...designInputs,
                material: { ...designInputs.material, density: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low Density (Budget)</option>
              <option value="medium">Medium Density (Standard)</option>
              <option value="high">High Density (Premium)</option>
            </select>
          </div>

          {/* AI Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FaRobot className="text-purple-600" /> AI Prompt (Optional)
            </label>
            <textarea
              value={designInputs.prompt}
              onChange={(e) => setDesignInputs({ ...designInputs, prompt: e.target.value })}
              placeholder="Describe your dream carpet design in detail..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <p className="text-xs text-gray-400 mt-1">Example: "Persian style with floral patterns in blue and gold"</p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateDesign}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Generating Design...
              </>
            ) : (
              <>
                <FaMagic /> Generate AI Design
              </>
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div className="space-y-6">
          {design ? (
            <>
              {/* 3D Preview */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaCube className="text-blue-600" /> 3D Preview
                </h2>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-64 flex items-center justify-center relative overflow-hidden">
                  {design.preview3D ? (
                    <img 
                      src={design.preview3D} 
                      alt="3D Preview" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <FaCube size={48} className="mx-auto mb-2" />
                      <p>3D preview will appear here</p>
                      <p className="text-xs mt-1">AI generated visualization</p>
                    </div>
                  )}
                  <button className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition">
                    <FaEye />
                  </button>
                </div>
              </div>

              {/* Cost Estimate */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaDollarSign className="text-green-600" /> Cost Estimate
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Materials:</span>
                    <span className="font-semibold">{design.costEstimate?.materials?.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Labor:</span>
                    <span className="font-semibold">{design.costEstimate?.labor?.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Pattern Complexity:</span>
                    <span className="font-semibold">{design.costEstimate?.pattern?.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between pt-3 font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">{design.costEstimate?.total?.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1"><FaClock /> Production Time:</span>
                    <span>{design.productionTime} hours</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSaveDesign}
                    disabled={saving}
                    className="bg-blue-600 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <FaSave /> {saving ? 'Saving...' : 'Save Design'}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="bg-green-600 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition"
                  >
                    <FaCheckCircle /> Add to Cart
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-purple-600 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition"
                  >
                    <FaDownload /> Download PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-orange-600 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-700 transition"
                  >
                    <FaPrint /> Print Specs
                  </button>
                  <button
                    onClick={handleShare}
                    className="bg-gray-600 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition"
                  >
                    <FaShare /> Share
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="bg-green-500 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition"
                  >
                    <FaWhatsapp /> WhatsApp
                  </button>
                </div>
              </div>

              {/* Design Details */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Design ID: {design.design?._id?.slice(-8)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Area: {(design.design?.dimensions.width * design.design?.dimensions.height / 10000).toFixed(2)} m²
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <FaMagic size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Design Yet</h3>
              <p className="text-gray-500">Adjust the parameters and click "Generate AI Design" to create your custom carpet design.</p>
              <div className="mt-4 flex justify-center gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">✨ AI Powered</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">🎨 Unique</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">💰 Cost Effective</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignStudio;