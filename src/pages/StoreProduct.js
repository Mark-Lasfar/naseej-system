import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaShoppingCart, FaStar, FaRegStar, FaStarHalfAlt, FaTruck, 
  FaShieldAlt, FaUndo, FaStore, FaHeart, FaRegHeart, FaShare,
  FaMinus, FaPlus, FaCheckCircle, FaClock, FaBox, FaTag,
  FaFacebook, FaTwitter, FaWhatsapp, FaEnvelope, FaExpand,
  FaPlay, FaPause, FaVideo, FaArrowLeft
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const StoreProduct = ({ addToCart }) => {
  const { storeSlug, productSlug } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const videoRef = useRef(null);
  const imageContainerRef = useRef(null);

  useEffect(() => {
    fetchProductAndStore();
    fetchReviews();
  }, [storeSlug, productSlug]);

  const fetchProductAndStore = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/${storeSlug}/product/${productSlug}`);
      setStore(response.data.store);
      setProduct(response.data.product);
      
      if (response.data.product) {
        const relatedRes = await axios.get(`${API_URL}/products/${response.data.product._id}/related`);
        setRelatedProducts(relatedRes.data);
      }
      
      const token = localStorage.getItem('token');
      if (token && response.data.product) {
        try {
          const wishlistRes = await axios.get(`${API_URL}/wishlist/check/${response.data.product._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsWishlisted(wishlistRes.data.isWishlisted);
        } catch (err) {
          console.error('Wishlist check error:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      try {
        const productRes = await axios.get(`${API_URL}/products/slug/${productSlug}`);
        setProduct(productRes.data);
        
        if (productRes.data.storeId) {
          const storeRes = await axios.get(`${API_URL}/stores/${productRes.data.storeId}`);
          setStore(storeRes.data);
        }
        
        const relatedRes = await axios.get(`${API_URL}/products/${productRes.data._id}/related`);
        setRelatedProducts(relatedRes.data);
      } catch (fallbackError) {
        toast.error('Product not found');
        navigate('/shop');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews/product/${productSlug}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const toggleFullscreen = () => {
    if (!imageContainerRef.current) return;
    if (!isFullscreen) {
      imageContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.imageUrl,
      storeId: product.storeId,
      storeName: store?.name
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add to wishlist');
      return;
    }
    
    try {
      if (isWishlisted) {
        await axios.delete(`${API_URL}/wishlist/${product._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Removed from wishlist');
      } else {
        await axios.post(`${API_URL}/wishlist`, { productId: product._id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Added to wishlist');
      }
      setIsWishlisted(!isWishlisted);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update wishlist');
    }
  };

  const shareProduct = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Naseej Marketplace!`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Product link copied to clipboard');
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Check out ${product.name} on Naseej: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const submitReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to leave a review');
      return;
    }
    
    if (!newReview.text.trim()) {
      toast.error('Please write a review');
      return;
    }
    
    setSubmittingReview(true);
    try {
      await axios.post(`${API_URL}/reviews`, {
        productId: product._id,
        rating: newReview.rating,
        text: newReview.text
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Review submitted successfully!');
      setNewReview({ rating: 5, text: '' });
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating, size = 'text-lg') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className={`text-yellow-400 ${size}`} />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className={`text-yellow-400 ${size}`} />);
    }
    while (stars.length < 5) {
      stars.push(<FaRegStar key={stars.length} className={`text-gray-300 ${size}`} />);
    }
    return stars;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-gray-500">The product you're looking for doesn't exist.</p>
        <Link to="/shop" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">
          Browse Products
        </Link>
      </div>
    );
  }

  const discountPercent = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean);
  const hasVideo = product.videoUrl;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Back Button - Mobile */}
      <button
        onClick={() => navigate(-1)}
        className="lg:hidden flex items-center gap-2 text-gray-600 mb-4 hover:text-blue-600 transition"
      >
        <FaArrowLeft /> Back
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 flex-wrap">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-blue-600">Shop</Link>
        <span>/</span>
        <Link to={`/shop/${store.slug}`} className="hover:text-blue-600 line-clamp-1 max-w-[120px] sm:max-w-none">
          {store.name}
        </Link>
        <span>/</span>
        <span className="text-gray-800 line-clamp-1 max-w-[150px] sm:max-w-none">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Product Images Gallery with Zoom */}
        <div>
          <div 
            ref={imageContainerRef}
            className="relative bg-gray-100 rounded-xl overflow-hidden mb-3 sm:mb-4"
            style={{ height: 'auto', minHeight: '300px', aspectRatio: '1/1' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            {discountPercent > 0 && (
              <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold z-10">
                -{discountPercent}% OFF
              </span>
            )}
            {product.isNew && (
              <span className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-green-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold z-10">
                New
              </span>
            )}
            
            {hasVideo && selectedImage === images.length ? (
              <div className="relative w-full h-full" style={{ aspectRatio: '1/1' }}>
                <video
                  ref={videoRef}
                  src={product.videoUrl}
                  className="w-full h-full object-contain"
                  controls={false}
                  poster={product.imageUrl}
                />
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (isVideoPlaying) {
                        videoRef.current.pause();
                      } else {
                        videoRef.current.play();
                      }
                      setIsVideoPlaying(!isVideoPlaying);
                    }
                  }}
                  className="absolute inset-0 m-auto w-12 h-12 sm:w-16 sm:h-16 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition"
                >
                  {isVideoPlaying ? <FaPause className="text-white text-xl sm:text-2xl" /> : <FaPlay className="text-white text-xl sm:text-2xl ml-1" />}
                </button>
              </div>
            ) : (
              <img 
                src={images[selectedImage] || product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-contain transition-transform duration-200"
                style={{
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                  cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                  height: 'auto',
                  minHeight: '300px',
                  aspectRatio: '1/1'
                }}
              />
            )}
            
            <button
              onClick={toggleFullscreen}
              className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/50 p-1.5 sm:p-2 rounded-lg hover:bg-black/70 transition z-10"
            >
              <FaExpand className="text-white text-sm sm:text-base" />
            </button>
          </div>
          
          {/* Thumbnails */}
          {(images.length > 1 || hasVideo) && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {images.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 border-2 transition ${
                    selectedImage === idx ? 'border-blue-600 shadow-lg' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {hasVideo && (
                <div 
                  onClick={() => setSelectedImage(images.length)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 border-2 transition flex items-center justify-center bg-gray-800 ${
                    selectedImage === images.length ? 'border-blue-600 shadow-lg' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <FaVideo className="text-white text-xl sm:text-2xl" />
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Store Info */}
          <Link to={`/shop/${store.slug}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2 sm:mb-3 group text-sm sm:text-base">
            <FaStore className="text-gray-500 group-hover:text-blue-600" />
            <span className="font-medium">{store.name}</span>
            <span className="text-xs text-gray-400">View Store →</span>
          </Link>
          
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            <div className="flex gap-0.5 sm:gap-1">{renderStars(product.rating, 'text-sm sm:text-base')}</div>
            <span className="text-xs sm:text-sm text-gray-500">({product.reviewCount} reviews)</span>
            {product.soldCount > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-xs sm:text-sm text-gray-500">{product.soldCount} sold</span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="mb-4">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">{product.price.toLocaleString()} EGP</span>
            {product.oldPrice > 0 && (
              <span className="text-sm sm:text-lg text-gray-400 line-through ml-2">{product.oldPrice.toLocaleString()} EGP</span>
            )}
          </div>

          {/* Short Description */}
          <p className="text-gray-600 text-sm sm:text-base mb-6 line-clamp-3">{product.description?.substring(0, 200)}...</p>

          {/* Features */}
          {product.features?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Key Features:</h3>
              <ul className="list-disc list-inside text-gray-600 text-sm sm:text-base space-y-1">
                {product.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="line-clamp-1">{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Stock Status */}
          <div className="mb-4">
            {product.quantity > 0 ? (
              <span className="text-green-600 flex items-center gap-1 text-sm sm:text-base">
                <FaCheckCircle /> In Stock ({product.quantity} available)
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1 text-sm sm:text-base">
                <FaClock /> Out of Stock
              </span>
            )}
          </div>

          {/* Quantity and Actions */}
          {product.quantity > 0 && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-gray-100 transition"
                >
                  <FaMinus className="text-xs sm:text-sm" />
                </button>
                <span className="px-4 py-1.5 sm:px-6 sm:py-2 border-x w-12 sm:w-16 text-center text-sm sm:text-base">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-gray-100 transition"
                >
                  <FaPlus className="text-xs sm:text-sm" />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition text-sm sm:text-base"
              >
                <FaShoppingCart /> Add to Cart
              </button>
              <button
                onClick={handleWishlist}
                className={`p-2.5 sm:p-3 border rounded-lg transition ${
                  isWishlisted ? 'bg-red-50 border-red-300 text-red-500' : 'hover:bg-gray-50'
                }`}
              >
                {isWishlisted ? <FaHeart /> : <FaRegHeart />}
              </button>
              <button
                onClick={shareProduct}
                className="p-2.5 sm:p-3 border rounded-lg hover:bg-gray-50 transition"
              >
                <FaShare />
              </button>
            </div>
          )}

          {/* Share Buttons - Mobile Optimized */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={shareViaWhatsApp} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 hover:bg-green-600 transition">
              <FaWhatsapp /> WhatsApp
            </button>
          </div>

          {/* Shipping Info */}
          <div className="border-t pt-4 space-y-2 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-2"><FaTruck className="text-blue-500 text-sm sm:text-base" /> Free shipping on orders over {(store.settings?.freeShippingThreshold || 1000).toLocaleString()} EGP</div>
            <div className="flex items-center gap-2"><FaShieldAlt className="text-green-500 text-sm sm:text-base" /> Sold by {store.name}</div>
            <div className="flex items-center gap-2"><FaUndo className="text-orange-500 text-sm sm:text-base" /> Easy returns within 14 days</div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs - Responsive */}
      <div className="mt-8 sm:mt-12">
        <div className="border-b flex gap-3 sm:gap-6 mb-4 sm:mb-6 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-2 sm:pb-3 px-2 sm:px-1 font-medium whitespace-nowrap text-sm sm:text-base transition ${
              activeTab === 'description' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`pb-2 sm:pb-3 px-2 sm:px-1 font-medium whitespace-nowrap text-sm sm:text-base transition ${
              activeTab === 'specifications' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-2 sm:pb-3 px-2 sm:px-1 font-medium whitespace-nowrap text-sm sm:text-base transition ${
              activeTab === 'reviews' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reviews ({product.reviewCount})
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p className="text-gray-600 whitespace-pre-line leading-relaxed text-sm sm:text-base">{product.description}</p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex justify-between py-2 border-b text-sm sm:text-base">
                <span className="font-medium">Category</span>
                <span className="text-gray-600 capitalize">{product.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm sm:text-base">
                <span className="font-medium">Subcategory</span>
                <span className="text-gray-600">{product.subcategory || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm sm:text-base">
                <span className="font-medium">Material</span>
                <span className="text-gray-600">{product.material || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm sm:text-base">
                <span className="font-medium">Size</span>
                <span className="text-gray-600">{product.size || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm sm:text-base">
                <span className="font-medium">Color</span>
                <span className="text-gray-600">{product.color || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm sm:text-base">
                <span className="font-medium">SKU</span>
                <span className="text-gray-600 font-mono text-xs sm:text-sm">{product._id?.slice(-8)}</span>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Review Form */}
              <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3 text-sm sm:text-base">Write a Review</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs sm:text-sm">Your Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button
                        key={r}
                        onClick={() => setNewReview({ ...newReview, rating: r })}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        {r <= newReview.rating ? (
                          <FaStar className="text-yellow-400 text-lg sm:text-xl" />
                        ) : (
                          <FaRegStar className="text-gray-300 text-lg sm:text-xl" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newReview.text}
                  onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                  placeholder="Share your experience with this product..."
                  className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  rows="3"
                />
                <button
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50 text-sm sm:text-base"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm sm:text-base">No reviews yet. Be the first to review this product!</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reviews.map(review => (
                    <div key={review._id} className="border-b pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              {review.userId?.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="font-medium text-sm sm:text-base">{review.userId?.username || 'Anonymous'}</span>
                          <div className="flex gap-0.5 ml-2">
                            {renderStars(review.rating, 'text-xs sm:text-sm')}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(review.timestamp)}</span>
                      </div>
                      <p className="text-gray-600 text-sm sm:text-base mt-2 sm:ml-10">{review.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products - Responsive Grid */}
      {relatedProducts.length > 0 && (
        <div className="mt-8 sm:mt-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map(related => (
              <Link 
                to={`/product/${related.slug}`}
                key={related._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-32 sm:h-40 overflow-hidden bg-gray-100">
                  <img src={related.imageUrl} alt={related.name} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                </div>
                <div className="p-2 sm:p-3">
                  <h3 className="font-medium text-xs sm:text-sm line-clamp-1">{related.name}</h3>
                  <p className="text-blue-600 font-bold text-xs sm:text-sm mt-1">{related.price.toLocaleString()} EGP</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreProduct;