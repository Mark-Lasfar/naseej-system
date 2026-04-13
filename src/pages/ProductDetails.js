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
  FaYoutube, FaVideo
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
  const videoRef = useRef(null);
  const imageContainerRef = useRef(null);
  
  // Review Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // جلب المنتج
  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [slug]);

  // جلب المنتجات المشابهة بعد تحميل المنتج
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
    if (!isZoomed) return;
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
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    while (stars.length < 5) {
      stars.push(<FaRegStar key={stars.length} className="text-yellow-400" />);
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

  // الحصول على قائمة جميع الوسائط (صور + فيديو)
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
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) return null;

  const discountPercent = calculateDiscount();
  const mediaItems = getAllMedia();
  const currentMedia = mediaItems[selectedImage];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-blue-600">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{product.category === 'carpet' ? 'Carpets' : 'Textiles'}</span>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{product.name}</span>
      </div>

      {/* Product Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Media Gallery with Zoom */}
        <div>
          {/* Main Media Display */}
          <div 
            ref={imageContainerRef}
            className="relative bg-gray-100 rounded-xl overflow-hidden mb-4"
            style={{ height: '500px' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
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
                  className="absolute inset-0 m-auto w-16 h-16 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition"
                >
                  {isVideoPlaying ? <FaPause className="text-white text-2xl" /> : <FaPlay className="text-white text-2xl ml-1" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-lg hover:bg-black/70 transition"
                >
                  <FaExpand className="text-white" />
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full overflow-hidden">
                <img 
                  src={currentMedia?.url}
                  alt={product.name}
                  className={`w-full h-full object-contain transition-transform duration-200 ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  style={{
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                  }}
                />
                <button
                  onClick={toggleFullscreen}
                  className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-lg hover:bg-black/70 transition"
                >
                  <FaExpand className="text-white" />
                </button>
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discountPercent > 0 && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                  -{discountPercent}%
                </span>
              )}
              {product.isNew && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                  New
                </span>
              )}
              {product.isFeatured && (
                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {mediaItems.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {mediaItems.map((media, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 border-2 transition ${
                    selectedImage === idx ? 'border-blue-600 shadow-lg' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {media.type === 'video' ? (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <FaPlay className="text-white text-2xl" />
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

        {/* Product Info */}
        <div>
          {/* Store Info */}
          {store && (
            <Link 
              to={`/shop/${store.slug}`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-3 group"
            >
              <FaStore className="text-gray-500 group-hover:text-blue-600" />
              <span className="font-medium">{store.name}</span>
              <span className="text-xs text-gray-400">View Store →</span>
            </Link>
          )}
          
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">{renderStars(product.rating)}</div>
            <span className="text-gray-500">({product.reviewCount} reviews)</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            {product.oldPrice > 0 ? (
              <div>
                <span className="text-3xl font-bold text-blue-600">{product.price.toLocaleString()} EGP</span>
                <span className="text-lg text-gray-400 line-through ml-2">{product.oldPrice.toLocaleString()} EGP</span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-blue-600">{product.price.toLocaleString()} EGP</span>
            )}
          </div>

          {/* Short Description */}
          <p className="text-gray-600 mb-6">{product.description?.substring(0, 200)}...</p>

          {/* Features */}
          {product.features?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Key Features:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {product.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Stock Status */}
          <div className="mb-4">
            {product.quantity > 0 ? (
              <span className="text-green-600 flex items-center gap-1">
                <FaCheck /> In Stock ({product.quantity} available)
              </span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>

          {/* Quantity Selector */}
          {product.quantity > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  className="px-4 py-2 hover:bg-gray-100 transition"
                >
                  <FaMinus />
                </button>
                <span className="px-6 py-2 border-x min-w-[60px] text-center">{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)}
                  className="px-4 py-2 hover:bg-gray-100 transition"
                >
                  <FaPlus />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition"
              >
                <FaShoppingCart /> Add to Cart
              </button>
              <button className="p-3 border rounded-lg hover:bg-gray-50 transition">
                <FaHeart />
              </button>
              <button className="p-3 border rounded-lg hover:bg-gray-50 transition">
                <FaShare />
              </button>
            </div>
          )}

          {/* Shipping Info */}
          <div className="border-t pt-4 space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FaTruck className="text-blue-500" /> Free shipping on orders over 1000 EGP
            </div>
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-green-500" /> 2-year warranty on all carpets
            </div>
            <div className="flex items-center gap-2">
              <FaUndo className="text-orange-500" /> Easy returns within 14 days
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mb-12">
        <div className="border-b flex gap-6 mb-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('description')}
            className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'description' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Description
          </button>
          <button 
            onClick={() => setActiveTab('specifications')}
            className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'specifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Specifications
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'reviews' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Reviews ({product.reviewCount})
          </button>
          {store && (
            <button 
              onClick={() => setActiveTab('store')}
              className={`pb-3 px-1 font-medium whitespace-nowrap ${activeTab === 'store' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Store Info
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          {activeTab === 'description' && (
            <div>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Category</span>
                <span className="text-gray-600 capitalize">{product.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Subcategory</span>
                <span className="text-gray-600">{product.subcategory || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Material</span>
                <span className="text-gray-600">{product.material || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Size</span>
                <span className="text-gray-600">{product.size || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Color</span>
                <span className="text-gray-600">{product.color || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">SKU</span>
                <span className="text-gray-600">{product._id?.slice(-8)}</span>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Rating Summary */}
              <div className="flex flex-col md:flex-row items-center gap-8 pb-6 border-b mb-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-800">{product.rating.toFixed(1)}</div>
                  <div className="flex gap-1 my-2">{renderStars(product.rating)}</div>
                  <div className="text-sm text-gray-500">Based on {product.reviewCount} reviews</div>
                </div>
                <div className="flex-1 w-full">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const percentage = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-8">{star} ★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="w-12 text-gray-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review Button */}
              <div className="text-center mb-8">
                <button 
                  onClick={() => setShowReviewModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
                >
                  Write a Review
                </button>
              </div>

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="border-b pb-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                            <FaUser />
                          </div>
                          <div>
                            <p className="font-semibold">{review.user?.username || 'Anonymous'}</p>
                            <div className="flex gap-1 text-sm">{renderStars(review.rating)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <FaCalendarAlt />
                          <span>{formatDate(review.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-2 ml-13">{review.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'store' && store && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <FaStore className="text-white text-3xl" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{store.name}</h3>
                  <Link to={`/shop/${store.slug}`} className="text-blue-600 hover:text-blue-800 text-sm">
                    Visit Store →
                  </Link>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{store.description || 'No description available.'}</p>
              {store.contact && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {store.contact.phone && <p>📞 {store.contact.phone}</p>}
                  {store.contact.email && <p>✉️ {store.contact.email}</p>}
                  {store.contact.address && <p>📍 {store.contact.address}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative animate-fade-in">
            <button 
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FaTimes size={20} />
            </button>
            
            <h2 className="text-xl font-bold mb-4">Write a Review</h2>
            <p className="text-gray-500 mb-4">Rate this product: {product.name}</p>
            
            {/* Rating Stars */}
            <div className="flex justify-center gap-2 mb-4">
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
                    <FaStar className="text-yellow-400 text-3xl" />
                  ) : (
                    <FaRegStar className="text-yellow-400 text-3xl" />
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
                rows="5"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Share your experience with this product..."
              />
            </div>
            
            {/* Submit Button */}
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(related => (
              <Link 
                to={`/product/${related.slug}`} 
                key={related._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-48 overflow-hidden bg-gray-100">
                  <img 
                    src={related.imageUrl} 
                    alt={related.name} 
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">{related.name}</h3>
                  <p className="text-blue-600 font-bold mt-1">{related.price.toLocaleString()} EGP</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 1 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {recentlyViewed.filter(p => p._id !== product._id).slice(0, 5).map(recent => (
              <Link 
                to={`/product/${recent.slug}`} 
                key={recent._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-32 overflow-hidden bg-gray-100">
                  <img 
                    src={recent.imageUrl} 
                    alt={recent.name} 
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-2">
                  <h3 className="text-xs font-medium line-clamp-1">{recent.name}</h3>
                  <p className="text-blue-600 font-bold text-xs">{recent.price.toLocaleString()} EGP</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;