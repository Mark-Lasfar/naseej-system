import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart, 
  FaHeart, FaShare, FaTruck, FaShieldAlt, FaUndo,
  FaMinus, FaPlus, FaCheck, FaEye, FaTimes,
  FaUser, FaCalendarAlt, FaRegThumbsUp, FaRegThumbsDown,
  FaStore, FaPlay, FaPause, FaExpand, FaCompress,
  FaYoutube, FaVideo, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const ProductDetails = ({ addToCart }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const videoRef = useRef(null);
  const imageContainerRef = useRef(null);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // جلب المنتج
  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [slug]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
      fetchStoreInfo();
      updateRecentlyViewed(product);
    }
  }, [product]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/slug/${slug}`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreInfo = async () => {
    if (!product?.storeId) return;
    try {
      const response = await axios.get(`${API_URL}/stores/${product.storeId}`);
      setStore(response.data.store);
    } catch (error) {
      console.error('Failed to fetch store info');
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product?._id) return;
    try {
      const response = await axios.get(`${API_URL}/products/${product._id}/related`);
      setRelatedProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch related products');
    }
  };

  const fetchReviews = async () => {
    if (!slug) return;
    try {
      const response = await axios.get(`${API_URL}/reviews/product/${slug}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      toast.error('Please write your review');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to write a review');
      navigate('/login');
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await axios.post(
        `${API_URL}/reviews`,
        {
          productId: product._id,
          rating: reviewRating,
          text: reviewText
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Review submitted successfully!');
        setShowReviewModal(false);
        setReviewText('');
        setReviewRating(5);
        fetchReviews();
        fetchProduct();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const updateRecentlyViewed = (product) => {
    const stored = localStorage.getItem('recentlyViewed');
    let recent = stored ? JSON.parse(stored) : [];
    recent = recent.filter(p => p._id !== product._id);
    recent.unshift({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category
    });
    recent = recent.slice(0, 10);
    localStorage.setItem('recentlyViewed', JSON.stringify(recent));
    setRecentlyViewed(recent);
  };

  const handleQuantityChange = (delta) => {
    setQuantity(Math.max(1, Math.min(product?.quantity || 1, quantity + delta)));
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

  const handleMouseMove = (e) => {
    if (!isZoomed || isMobile) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
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

  const nextImage = () => {
    if (mediaItems.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length);
      setSelectedImage((prev) => (prev + 1) % mediaItems.length);
    }
  };

  const prevImage = () => {
    if (mediaItems.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
      setSelectedImage((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    }
  };

  const calculateDiscount = () => {
    if (!product) return 0;
    if (product.oldPrice && product.oldPrice > product.price) {
      return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
    }
    return product.discount || 0;
  };

  const renderStars = (rating, size = "default") => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const starSize = isMobile ? "text-sm" : "text-base";
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className={`text-yellow-400 ${starSize}`} />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className={`text-yellow-400 ${starSize}`} />);
    }
    while (stars.length < 5) {
      stars.push(<FaRegStar key={stars.length} className={`text-yellow-400 ${starSize}`} />);
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

  const getAllMedia = () => {
    const media = [];
    if (product?.imageUrl) {
      media.push({ type: 'image', url: product.imageUrl });
    }
    if (product?.images) {
      product.images.forEach(img => media.push({ type: 'image', url: img }));
    }
    if (product?.videoUrl) {
      media.push({ type: 'video', url: product.videoUrl });
    }
    return media;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) return null;

  const discountPercent = calculateDiscount();
  const mediaItems = getAllMedia();
  const currentMedia = mediaItems[selectedImage];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb - متجاوب */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-2 sm:py-3">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-1">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-1">/</span>
            <Link to="/shop" className="hover:text-blue-600">Shop</Link>
            <span className="mx-1">/</span>
            <span className="text-gray-800 truncate max-w-[150px] sm:max-w-[300px]">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
          {/* Media Gallery - متجاوب */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Main Media Display */}
            <div 
              ref={imageContainerRef}
              className="relative bg-gray-100"
              style={{ height: isMobile ? '300px' : '400px' }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => !isMobile && setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              {currentMedia?.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={currentMedia.url}
                    className="w-full h-full object-contain"
                    controls={false}
                    poster={product.imageUrl}
                  />
                  <button
                    onClick={toggleVideoPlay}
                    className="absolute inset-0 m-auto w-12 h-12 sm:w-16 sm:h-16 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition"
                  >
                    {isVideoPlaying ? <FaPause className="text-white text-xl sm:text-2xl" /> : <FaPlay className="text-white text-xl sm:text-2xl ml-1" />}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="absolute bottom-3 right-3 bg-black/50 p-1.5 sm:p-2 rounded-lg hover:bg-black/70 transition"
                  >
                    <FaExpand className="text-white text-sm sm:text-base" />
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full overflow-hidden">
                  <img 
                    src={currentMedia?.url}
                    alt={product.name}
                    className={`w-full h-full object-contain transition-transform duration-200 ${
                      isZoomed && !isMobile ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                    style={{
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                    }}
                  />
                  <button
                    onClick={toggleFullscreen}
                    className="absolute bottom-3 right-3 bg-black/50 p-1.5 sm:p-2 rounded-lg hover:bg-black/70 transition"
                  >
                    <FaExpand className="text-white text-sm sm:text-base" />
                  </button>
                </div>
              )}
              
              {/* Navigation Arrows for Mobile */}
              {mediaItems.length > 1 && isMobile && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
                  >
                    <FaChevronLeft className="text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
                  >
                    <FaChevronRight className="text-white" />
                  </button>
                </>
              )}
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {discountPercent > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    -{discountPercent}%
                  </span>
                )}
                {product.isNew && (
                  <span className="bg-green-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    New
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-yellow-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    Featured
                  </span>
                )}
              </div>
              
              {/* Image Counter */}
              {mediaItems.length > 1 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {selectedImage + 1} / {mediaItems.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {mediaItems.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {mediaItems.map((media, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 border-2 transition ${
                      selectedImage === idx ? 'border-blue-600 shadow-lg' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <FaPlay className="text-white text-xl sm:text-2xl" />
                        <div className="absolute inset-0 bg-black/40"></div>
                      </div>
                    ) : (
                      <img src={media.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    )}
                    {media.type === 'video' && (
                      <div className="absolute bottom-1 right-1">
                        <FaVideo className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - متجاوب */}
          <div>
            {/* Store Info */}
            {store && (
              <Link 
                to={`/shop/${store.slug}`}
                className="inline-flex items-center gap-1 sm:gap-2 text-blue-600 hover:text-blue-800 mb-2 sm:mb-3 group"
              >
                <FaStore className="text-gray-500 group-hover:text-blue-600 text-sm sm:text-base" />
                <span className="font-medium text-sm sm:text-base">{store.name}</span>
                <span className="text-xs text-gray-400">→</span>
              </Link>
            )}
            
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 leading-tight">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <div className="flex gap-0.5">{renderStars(product.rating)}</div>
              <span className="text-xs sm:text-sm text-gray-500">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-3 sm:mb-4">
              {product.oldPrice > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600">{product.price.toLocaleString()} EGP</span>
                  <span className="text-sm sm:text-base text-gray-400 line-through">{product.oldPrice.toLocaleString()} EGP</span>
                </div>
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-blue-600">{product.price.toLocaleString()} EGP</span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
              {product.description?.substring(0, isMobile ? 150 : 200)}...
            </p>

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-sm sm:text-base mb-2">Key Features:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-xs sm:text-sm">
                  {product.features.slice(0, isMobile ? 3 : 4).map((feature, idx) => (
                    <li key={idx} className="break-words">{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-3 sm:mb-4">
              {product.quantity > 0 ? (
                <span className="text-green-600 flex items-center gap-1 text-sm sm:text-base">
                  <FaCheck className="text-xs sm:text-sm" /> In Stock ({product.quantity} available)
                </span>
              ) : (
                <span className="text-red-600 text-sm sm:text-base">Out of Stock</span>
              )}
            </div>

            {/* Quantity Selector */}
            {product.quantity > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center border rounded-lg w-fit">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    className="px-3 sm:px-4 py-2 hover:bg-gray-100 transition"
                    aria-label="Decrease quantity"
                  >
                    <FaMinus size={12} />
                  </button>
                  <span className="px-4 sm:px-6 py-2 border-x min-w-[50px] text-center text-sm sm:text-base">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    className="px-3 sm:px-4 py-2 hover:bg-gray-100 transition"
                    aria-label="Increase quantity"
                  >
                    <FaPlus size={12} />
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition text-sm sm:text-base"
                >
                  <FaShoppingCart /> Add to Cart
                </button>
                <div className="flex gap-2">
                  <button className="p-2.5 border rounded-lg hover:bg-gray-50 transition">
                    <FaHeart className="text-gray-500" />
                  </button>
                  <button className="p-2.5 border rounded-lg hover:bg-gray-50 transition">
                    <FaShare className="text-gray-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Shipping Info */}
            <div className="border-t pt-3 sm:pt-4 space-y-2 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FaTruck className="text-blue-500 text-sm" /> Free shipping on orders over 1000 EGP
              </div>
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-green-500 text-sm" /> 2-year warranty on all carpets
              </div>
              <div className="flex items-center gap-2">
                <FaUndo className="text-orange-500 text-sm" /> Easy returns within 14 days
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs - متجاوب */}
        <div className="mb-8 sm:mb-12">
          <div className="border-b flex gap-3 sm:gap-6 mb-4 sm:mb-6 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('description')}
              className={`pb-2 sm:pb-3 px-2 sm:px-1 font-medium whitespace-nowrap text-sm sm:text-base transition ${
                activeTab === 'description' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Description
            </button>
            <button 
              onClick={() => setActiveTab('specifications')}
              className={`pb-2 sm:pb-3 px-2 sm:px-1 font-medium whitespace-nowrap text-sm sm:text-base transition ${
                activeTab === 'specifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Specifications
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`pb-2 sm:pb-3 px-2 sm:px-1 font-medium whitespace-nowrap text-sm sm:text-base transition ${
                activeTab === 'reviews' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews ({product.reviewCount})
            </button>
            {store && (
              <button 
                onClick={() => setActiveTab('store')}
                className={`pb-2 sm:pb-3 px-2 sm:px-1 font-medium whitespace-nowrap text-sm sm:text-base transition ${
                  activeTab === 'store' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Store Info
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            {activeTab === 'description' && (
              <div>
                <p className="text-gray-600 text-sm sm:text-base whitespace-pre-line leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-sm sm:text-base">Category</span>
                  <span className="text-gray-600 capitalize text-sm sm:text-base">{product.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-sm sm:text-base">Subcategory</span>
                  <span className="text-gray-600 text-sm sm:text-base">{product.subcategory || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-sm sm:text-base">Material</span>
                  <span className="text-gray-600 text-sm sm:text-base">{product.material || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-sm sm:text-base">Size</span>
                  <span className="text-gray-600 text-sm sm:text-base">{product.size || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-sm sm:text-base">Color</span>
                  <span className="text-gray-600 text-sm sm:text-base">{product.color || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-sm sm:text-base">SKU</span>
                  <span className="text-gray-600 text-sm sm:text-base">{product._id?.slice(-8)}</span>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {/* Rating Summary */}
                <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-8 pb-4 sm:pb-6 border-b mb-4 sm:mb-6">
                  <div className="text-center">
                    <div className="text-3xl sm:text-5xl font-bold text-gray-800">{product.rating.toFixed(1)}</div>
                    <div className="flex gap-0.5 my-1 sm:my-2">{renderStars(product.rating)}</div>
                    <div className="text-xs sm:text-sm text-gray-500">Based on {product.reviewCount} reviews</div>
                  </div>
                  <div className="flex-1 w-full">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const percentage = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs sm:text-sm">
                          <span className="w-8">{star} ★</span>
                          <div className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="w-8 text-gray-500 text-xs">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Write Review Button */}
                <div className="text-center mb-6 sm:mb-8">
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition text-sm sm:text-base"
                  >
                    Write a Review
                  </button>
                </div>

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6 max-h-96 overflow-y-auto">
                    {reviews.map((review, idx) => (
                      <div key={idx} className="border-b pb-4 sm:pb-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                              <FaUser size={isMobile ? 12 : 14} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm sm:text-base">{review.user?.username || 'Anonymous'}</p>
                              <div className="flex gap-0.5 text-xs sm:text-sm">{renderStars(review.rating)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <FaCalendarAlt size={12} />
                            <span>{formatDate(review.timestamp)}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm sm:text-base mt-2">{review.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm sm:text-base">No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'store' && store && (
              <div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {store.logo ? (
                    <img src={store.logo} alt={store.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <FaStore className="text-white text-2xl sm:text-3xl" />
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-bold">{store.name}</h3>
                    <Link to={`/shop/${store.slug}`} className="text-blue-600 hover:text-blue-800 text-sm">
                      Visit Store →
                    </Link>
                  </div>
                </div>
                <p className="text-gray-600 text-sm sm:text-base mb-4">{store.description || 'No description available.'}</p>
                {store.contact && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    {store.contact.phone && <p>📞 {store.contact.phone}</p>}
                    {store.contact.email && <p>✉️ {store.contact.email}</p>}
                    {store.contact.address && <p>📍 {store.contact.address}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section - متجاوب */}
        {relatedProducts.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {relatedProducts.slice(0, isMobile ? 4 : 8).map(related => (
                <Link 
                  to={`/product/${related.slug}`} 
                  key={related._id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="h-32 sm:h-40 lg:h-48 overflow-hidden bg-gray-100">
                    <img 
                      src={related.imageUrl} 
                      alt={related.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-2 sm:p-3">
                    <h3 className="font-medium text-xs sm:text-sm line-clamp-2">{related.name}</h3>
                    <p className="text-blue-600 font-bold text-sm sm:text-base mt-1">{related.price.toLocaleString()} EGP</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Products Section - متجاوب */}
        {recentlyViewed.length > 1 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Recently Viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {recentlyViewed.filter(p => p._id !== product._id).slice(0, isMobile ? 4 : 5).map(recent => (
                <Link 
                  to={`/product/${recent.slug}`} 
                  key={recent._id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="h-24 sm:h-28 lg:h-32 overflow-hidden bg-gray-100">
                    <img 
                      src={recent.imageUrl} 
                      alt={recent.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="text-xs font-medium line-clamp-2">{recent.name}</h3>
                    <p className="text-blue-600 font-bold text-xs sm:text-sm mt-1">{recent.price.toLocaleString()} EGP</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal - متجاوب */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 relative animate-fade-in">
            <button 
              onClick={() => setShowReviewModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes size={isMobile ? 16 : 20} />
            </button>
            
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Write a Review</h2>
            <p className="text-gray-500 text-sm mb-3 sm:mb-4">Rate this product: {product.name}</p>
            
            {/* Rating Stars */}
            <div className="flex justify-center gap-1 sm:gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  {star <= (hoverRating || reviewRating) ? (
                    <FaStar className="text-yellow-400 text-2xl sm:text-3xl" />
                  ) : (
                    <FaRegStar className="text-yellow-400 text-2xl sm:text-3xl" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Review Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={isMobile ? 4 : 5}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                placeholder="Share your experience with this product..."
              />
            </div>
            
            {/* Submit Button */}
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50 text-sm sm:text-base"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;