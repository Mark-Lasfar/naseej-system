import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import {
  FaStore, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook,
  FaInstagram, FaTwitter, FaWhatsapp, FaStar, FaStarHalfAlt,
  FaTruck, FaShieldAlt, FaUndo, FaHeart, FaShare, FaRegHeart,
  FaFilter, FaSearch, FaTimes, FaChevronDown, FaChevronUp,
  FaBox, FaShoppingBag, FaUser, FaCalendarAlt, FaCheckCircle,
  FaArrowRight, FaArrowLeft, FaTag, FaFire, FaGem, FaClock,
  FaShippingFast, FaMedal, FaAward, FaGlobe, FaCreditCard,
  FaComments, FaQuestionCircle, FaBell, FaRegBell, FaArrowUp,
  FaRegComment, FaThumbsUp, FaNewspaper
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Simple Lazy Image Component
const LazyImage = ({ src, alt, className }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      });
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div ref={imgRef} className={`overflow-hidden ${className}`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-4xl">{alt?.includes('carpet') ? '🪑' : '🧵'}</div>
        </div>
      )}
    </div>
  );
};

// Post Component للعرض داخل المتجر
const StorePost = ({ post, currentUser, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localPost, setLocalPost] = useState(post);
  const [liked, setLiked] = useState(post.liked || false);

  useEffect(() => {
    setLocalPost(post);
    setLiked(post.liked || false);
  }, [post]);

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/posts/${post._id}/like`);
      setLiked(!liked);
      setLocalPost({
        ...localPost,
        likesCount: response.data.likesCount
      });
      if (onLike) onLike(post._id, response.data);
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    if (!currentUser) {
      toast.error('Please login to comment');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/posts/${post._id}/comment`, {
        content: commentText
      });
      setLocalPost({
        ...localPost,
        commentsCount: localPost.commentsCount + 1
      });
      setCommentText('');
      toast.success('Comment added');
      if (onComment) onComment(post._id, response.data.comment);
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'public': return <FaGlobe className="text-green-500 text-xs" />;
      case 'followers': return <FaUsers className="text-blue-500 text-xs" />;
      case 'private': return <FaLock className="text-red-500 text-xs" />;
      default: return <FaGlobe className="text-green-500 text-xs" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
      {/* Post Header */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
            <Link to={post.userId?.storeId?.slug ? `/shop/${post.userId.storeId.slug}` : `/shop`}>
      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm overflow-hidden">
        {post.userId?.storeId?.logo ? (
          <img src={post.userId.storeId.logo} alt={post.userId?.username} className="w-full h-full object-cover" />
        ) : (
          post.userId?.username?.charAt(0).toUpperCase() || 'U'
        )}
      </div>
    </Link>
    <div>
      <Link to={post.userId?.storeId?.slug ? `/shop/${post.userId.storeId.slug}` : `/shop`} className="font-semibold hover:text-blue-600 text-sm">
        {post.userId?.storeId?.name || post.userId?.username || 'Anonymous'}
      </Link>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              {getVisibilityIcon(post.visibility)}
              <span>{moment(post.createdAt).fromNow()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-2">
        <p className="text-gray-700 whitespace-pre-line text-sm">{post.content}</p>
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags.map(tag => (
              <span key={tag} className="text-blue-500 text-xs">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {post.media?.length > 0 && (
        <div className={`grid gap-1 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media.map((media, idx) => (
            <div key={idx} className="relative bg-gray-100">
              {media.type === 'video' ? (
                <video src={media.url} controls className="w-full max-h-80 object-cover" />
              ) : (
                <img src={media.url} alt={`Post ${idx + 1}`} className="w-full max-h-80 object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 border-t flex justify-around">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
        >
          {liked ? <FaHeart /> : <FaRegHeart />}
          <span>{localPost.likesCount || 0}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition"
        >
          <FaRegComment />
          <span>{localPost.commentsCount || 0}</span>
        </button>
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-500 transition">
          <FaShare />
          <span>{post.sharesCount || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t pt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCommentSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StorePage = ({ addToCart }) => {
  const { storeSlug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'posts'
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const productsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchStore();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [storeSlug]);

  useEffect(() => {
    filterAndSortProducts();
  }, [searchTerm, sortBy, priceRange, products, activeCategory]);

  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStore = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/${storeSlug}`);
      setStore(response.data.store);
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
      setFollowersCount(response.data.store.stats?.followers || 0);

      // Fetch store posts
      await fetchStorePosts(response.data.store._id);

      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.products.map(p => p.category).filter(c => c))];
      setCategories(uniqueCategories);

      // Get featured products
      const featured = [...response.data.products]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.soldCount || 0) - (a.soldCount || 0))
        .slice(0, 4);
      setFeaturedProducts(featured);

      // Check if user follows this store
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const followCheck = await axios.get(`${API_URL}/stores/${storeSlug}/follow/check`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsFollowing(followCheck.data.following);
        } catch (err) {
          console.error('Follow check error:', err);
        }
      }
    } catch (error) {
      toast.error('Store not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorePosts = async (storeId) => {
  try {
    // استخدام الـ API الجديد لجلب منشورات المتجر فقط
    const response = await axios.get(`${API_URL}/posts/store/${storeId}`);
    setPosts(response.data.posts);
  } catch (error) {
    console.error('Failed to fetch store posts:', error);
    setPosts([]);
  }
};

  const filterAndSortProducts = () => {
    let filtered = [...products];

    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (priceRange.min) {
      filtered = filtered.filter(p => p.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(p => p.price <= Number(priceRange.max));
    }

    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleFollow = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to follow stores');
      return;
    }

    try {
      if (isFollowing) {
        await axios.delete(`${API_URL}/stores/${storeSlug}/follow`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFollowersCount(prev => prev - 1);
        setNotificationMessage(`Unfollowed ${store.name}`);
        toast.success(`Unfollowed ${store.name}`);
      } else {
        await axios.post(`${API_URL}/stores/${storeSlug}/follow`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFollowersCount(prev => prev + 1);
        setNotificationMessage(`Now following ${store.name}`);
        toast.success(`Following ${store.name}`);
      }
      setIsFollowing(!isFollowing);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update follow status');
    }
  };

  const shareStore = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: store.name,
        text: `Check out ${store.name} on Naseej Marketplace!`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Store link copied to clipboard');
    }
  };

  const handleAddToCartWithAnimation = (product) => {
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
      storeId: product.storeId
    });
    setNotificationMessage(`${product.name} added to cart!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
    toast.success(`${product.name} added to cart`);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating % 1) >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    while (stars.length < 5) {
      stars.push(<FaStar key={stars.length} className="text-gray-300" />);
    }
    return stars;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setPriceRange({ min: '', max: '' });
    setActiveCategory('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-8xl mb-6"
          >
            🏪
          </motion.div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Store Not Found
          </h2>
          <p className="text-gray-500 mb-6">The store you're looking for doesn't exist.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Browse Stores <FaArrowRight />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50"
    >
      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-20 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <FaCheckCircle />
            <span>{notificationMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cover Image Section */}
      <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70 z-10"></div>
        {store.coverImage ? (
          <img
            src={store.coverImage}
            alt={store.name}
            className="w-full h-full object-cover transform scale-105 animate-slow-zoom"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient"></div>
        )}

        {/* Store Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-end gap-6"
            >
              <div className="relative">
                {store.logo ? (
                  <img
                    src={store.logo}
                    alt={store.name}
                    className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl border-4 border-white shadow-2xl bg-white object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl border-4 border-white shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <FaStore className="text-white text-5xl" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-white">
                  <FaCheckCircle className="text-white text-xs" />
                </div>
              </div>

              <div className="flex-1 text-white">
                <h1 className="text-3xl lg:text-5xl font-bold mb-2">{store.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm lg:text-base">
                  <div className="flex items-center gap-1">
                    {renderStars(store.stats?.averageRating)}
                    <span className="ml-1">({store.stats?.totalReviews || 0} reviews)</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <FaShoppingBag />
                    <span>{store.stats?.totalSales?.toLocaleString() || 0} sales</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt />
                    <span>Since {new Date(store.createdAt).getFullYear()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollow}
                  className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 ${isFollowing
                      ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30'
                      : 'bg-white text-blue-600 hover:shadow-xl'
                    }`}
                >
                  {isFollowing ? <FaCheckCircle /> : <FaRegHeart />}
                  {isFollowing ? 'Following' : 'Follow'}
                  <span className="text-sm">({followersCount})</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={shareStore}
                  className="px-6 py-3 rounded-xl font-medium bg-white/20 backdrop-blur-sm text-white flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                >
                  <FaShare /> Share
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={scrollToProducts}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition cursor-pointer"
        >
          <FaChevronDown className="text-white animate-bounce" />
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8" ref={productsRef}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Store Info Sidebar */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-6">
              {/* About Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <FaStore className="text-blue-600" />
                  About Store
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {store.description || 'No description yet.'}
                </p>

                <div className="space-y-3 pt-4 border-t">
                  {store.contact?.address && (
                    <div className="flex items-start gap-3 text-sm">
                      <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{store.contact.address}</span>
                    </div>
                  )}
                  {store.contact?.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <FaPhone className="text-gray-400" />
                      <a href={`tel:${store.contact.phone}`} className="text-gray-600 hover:text-blue-600">
                        {store.contact.phone}
                      </a>
                    </div>
                  )}
                  {store.contact?.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <FaEnvelope className="text-gray-400" />
                      <a href={`mailto:${store.contact.email}`} className="text-gray-600 hover:text-blue-600">
                        {store.contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {(store.socialLinks?.facebook || store.socialLinks?.instagram || store.socialLinks?.twitter || store.socialLinks?.whatsapp) && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FaGlobe className="text-blue-600" />
                    Connect With Us
                  </h4>
                  <div className="flex gap-3">
                    {store.socialLinks?.facebook && (
                      <motion.a
                        whileHover={{ scale: 1.1, y: -2 }}
                        href={store.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-[#1877f2] text-white rounded-full flex items-center justify-center hover:shadow-lg transition"
                      >
                        <FaFacebook />
                      </motion.a>
                    )}
                    {store.socialLinks?.instagram && (
                      <motion.a
                        whileHover={{ scale: 1.1, y: -2 }}
                        href={store.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full flex items-center justify-center hover:shadow-lg transition"
                      >
                        <FaInstagram />
                      </motion.a>
                    )}
                    {store.socialLinks?.twitter && (
                      <motion.a
                        whileHover={{ scale: 1.1, y: -2 }}
                        href={store.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-[#1da1f2] text-white rounded-full flex items-center justify-center hover:shadow-lg transition"
                      >
                        <FaTwitter />
                      </motion.a>
                    )}
                    {store.socialLinks?.whatsapp && (
                      <motion.a
                        whileHover={{ scale: 1.1, y: -2 }}
                        href={`https://wa.me/${store.socialLinks.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-[#25d366] text-white rounded-full flex items-center justify-center hover:shadow-lg transition"
                      >
                        <FaWhatsapp />
                      </motion.a>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center"
                  >
                    <FaBox className="text-blue-600 text-2xl mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{store.stats?.totalProducts || 0}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center"
                  >
                    <FaShoppingBag className="text-green-600 text-2xl mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{store.stats?.totalSales?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-500">Total Sales</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center"
                  >
                    <FaHeart className="text-red-600 text-2xl mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">{followersCount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center"
                  >
                    <FaMedal className="text-orange-600 text-2xl mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">Top Rated</p>
                    <p className="text-xs text-gray-500">Seller Badge</p>
                  </motion.div>
                </div>
              </div>

              {/* Store Policies */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FaShieldAlt className="text-blue-600" />
                  Store Policies
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <FaTruck className="text-gray-400" />
                    <span>Free shipping over {(store.settings?.freeShippingThreshold || 1000).toLocaleString()} EGP</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <FaShieldAlt className="text-gray-400" />
                    <span>100% Verified Seller</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <FaUndo className="text-gray-400" />
                    <span>Easy returns within 14 days</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <FaCreditCard className="text-gray-400" />
                    <span>Secure payment methods</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Products Section */}
          <div className="lg:col-span-3">
            {/* Tabs: Products / Posts */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3 px-4 font-medium transition ${activeTab === 'products'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FaBox className="inline mr-2" /> Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`pb-3 px-4 font-medium transition ${activeTab === 'posts'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FaNewspaper className="inline mr-2" /> Posts ({posts.length})
              </button>
            </div>

            {/* Products Tab */}
            {activeTab === 'products' && (
              <>
                {/* Search and Filters Header */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                >
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative group">
                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Search products in this store..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer hover:border-blue-300 transition"
                    >
                      <option value="newest">🆕 Newest</option>
                      <option value="price_asc">💰 Price: Low to High</option>
                      <option value="price_desc">💰 Price: High to Low</option>
                      <option value="popular">🔥 Most Popular</option>
                      <option value="rating">⭐ Top Rated</option>
                    </select>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-5 py-3 border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all"
                    >
                      <FaFilter />
                      Filters
                      {showFilters ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </motion.button>

                    {(searchTerm || priceRange.min || priceRange.max || activeCategory !== 'all') && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={clearFilters}
                        className="px-5 py-3 text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-all"
                      >
                        <FaTimes /> Clear
                      </motion.button>
                    )}
                  </div>

                  {/* Category Pills */}
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                      <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === 'all'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        All Products
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {cat === 'carpet' ? '🪑 Carpets' : '🧵 Textiles'}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Advanced Filters */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-500 mb-2">Min Price (EGP)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={priceRange.min}
                              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-500 mb-2">Max Price (EGP)</label>
                            <input
                              type="number"
                              placeholder="Any"
                              value={priceRange.max}
                              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Results Count */}
                <div className="mb-4 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{filteredProducts.length}</span> of{' '}
                    <span className="font-semibold text-gray-700">{products.length}</span> products
                  </p>
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-lg"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-7xl mb-4"
                    >
                      🔍
                    </motion.div>
                    <p className="text-gray-500 text-lg mb-4">No products match your filters.</p>
                    <button
                      onClick={clearFilters}
                      className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-2"
                    >
                      Clear all filters <FaArrowRight />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredProducts.map((product, idx) => (
                      <motion.div
                        key={product._id}
                        variants={fadeInUp}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -8 }}
                        onHoverStart={() => setHoveredProduct(product._id)}
                        onHoverEnd={() => setHoveredProduct(null)}
                        className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                      >
                        {/* Product Image */}
                        <Link to={`/shop/${store.slug}/product/${product.slug?.split('-').slice(1).join('-') || product.slug}`}>
                          <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                            <LazyImage
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full"
                            />

                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                              {product.discount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                                  -{product.discount}%
                                </span>
                              )}
                              {product.isNew && (
                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                                  NEW
                                </span>
                              )}
                              {product.isFeatured && (
                                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                                  Featured
                                </span>
                              )}
                            </div>

                            {/* Quick view overlay */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: hoveredProduct === product._id ? 1 : 0 }}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center"
                            >
                              <span className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
                                Quick View
                              </span>
                            </motion.div>
                          </div>
                        </Link>

                        <div className="p-5">
                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-2">
                            {renderStars(product.rating)}
                            <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
                          </div>

                          {/* Title */}
                          <Link to={`/shop/${store.slug}/product/${product.slug?.split('-').slice(1).join('-') || product.slug}`}>
                            <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Details */}
                          <p className="text-gray-500 text-sm mb-2 line-clamp-1">
                            {product.material} {product.size && `| ${product.size}`}
                          </p>

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-blue-600">
                              {product.price.toLocaleString()} EGP
                            </span>
                            {product.oldPrice > 0 && (
                              <span className="text-sm text-gray-400 line-through">
                                {product.oldPrice.toLocaleString()} EGP
                              </span>
                            )}
                          </div>

                          {/* Stock status */}
                          <div className={`text-xs mb-3 flex items-center gap-1 ${product.quantity > 0 ? 'text-green-600' : 'text-red-500'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${product.quantity > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                              }`}></div>
                            {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                          </div>

                          {/* Add to Cart Button */}
                          {product.quantity > 0 ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAddToCartWithAnimation(product)}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
                            >
                              <FaShoppingBag /> Add to Cart
                            </motion.button>
                          ) : (
                            <button
                              disabled
                              className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl font-medium cursor-not-allowed"
                            >
                              Out of Stock
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                {posts.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-500 text-lg">No posts yet from this store.</p>
                    <p className="text-gray-400 text-sm mt-2">Check back later for updates!</p>
                  </div>
                ) : (
                  <div>
                    {posts.map(post => (
                      <StorePost
                        key={post._id}
                        post={post}
                        currentUser={currentUser}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 group"
          >
            <FaArrowUp className="group-hover:-translate-y-0.5 transition" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-out forwards;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-bounce {
          animation: bounce 1s ease infinite;
        }
      `}</style>
    </motion.div>
  );
};

export default StorePage;