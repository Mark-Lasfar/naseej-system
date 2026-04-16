import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaShoppingCart, FaStar, FaRegStar, FaPlus, FaMinus, FaFilter, FaTimes,
  FaStore, FaHeart, FaRegHeart, FaTruck, FaShieldAlt, FaTag, FaSearch,
  FaSort, FaSortAmountDown, FaSortAmountUp, FaChevronLeft, FaChevronRight,
  FaTh, FaThList, FaGrid, FaList, FaEye, FaInfoCircle
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const Shop = ({ addToCart, cartItems }) => {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('products');
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid', 'list'
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Responsive items per page
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    // Set items per page based on screen size
    if (windowWidth < 640) {
      setItemsPerPage(8);
    } else if (windowWidth < 1024) {
      setItemsPerPage(12);
    } else {
      setItemsPerPage(12);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth]);

  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
    setCurrentPage(1);
  }, [products, selectedCategory, selectedStore, searchTerm, sortBy, priceRange, selectedMaterials]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      const allProducts = response.data;
      setProducts(allProducts);
      
      const initialQuantities = {};
      allProducts.forEach(product => {
        initialQuantities[product._id] = 1;
      });
      setQuantities(initialQuantities);
      
      const materials = [...new Set(allProducts.map(p => p.material).filter(m => m))];
      setAvailableMaterials(materials);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${API_URL}/stores`);
      setStores(response.data);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];
    
    if (selectedStore !== 'all') {
      filtered = filtered.filter(p => p.storeId === selectedStore);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
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
    
    if (selectedMaterials.length > 0) {
      filtered = filtered.filter(p => selectedMaterials.includes(p.material));
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
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    
    setFilteredProducts(filtered);
  };

  const updateQuantity = (productId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  const handleAddToCart = (product) => {
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: quantities[product._id],
      imageUrl: product.imageUrl,
      storeId: product.storeId,
      storeName: stores.find(s => s._id === product.storeId)?.name
    });
    toast.success(`${product.name} added to cart`);
  };

  const toggleMaterial = (material) => {
    setSelectedMaterials(prev =>
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedStore('all');
    setSearchTerm('');
    setSortBy('newest');
    setPriceRange({ min: '', max: '' });
    setSelectedMaterials([]);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400 text-xs sm:text-sm" />);
    }
    for (let i = fullStars; i < 5; i++) {
      stars.push(<FaRegStar key={i} className="text-yellow-400 text-xs sm:text-sm" />);
    }
    return stars;
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get product card class based on layout mode
  const getProductCardClass = () => {
    if (layoutMode === 'list') {
      return "bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group";
    }
    return "bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group flex flex-col h-full";
  };

  // Get product image container class
  const getImageContainerClass = () => {
    if (layoutMode === 'list') {
      return "w-32 sm:w-40 h-32 sm:h-40 flex-shrink-0 overflow-hidden bg-gray-100";
    }
    return "h-40 sm:h-48 overflow-hidden bg-gray-100";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header - متجاوب */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-8 sm:py-12 mb-6 sm:mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            🛍️ Naseej Marketplace
          </h1>
          <p className="text-sm sm:text-base md:text-xl px-4">
            Discover unique carpets and textiles from talented sellers
          </p>
          
          {/* View Toggle - متجاوب */}
          <div className="flex justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={() => setViewMode('products')}
              className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg transition text-sm sm:text-base ${
                viewMode === 'products' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setViewMode('stores')}
              className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg transition text-sm sm:text-base ${
                viewMode === 'stores' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              Stores ({stores.length})
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 sm:pb-12">
        {/* Products View */}
        {viewMode === 'products' && (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Mobile Filter Button */}
            <div className="lg:hidden sticky top-16 z-20 bg-white rounded-xl shadow-sm p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-500" />
                  <span className="font-medium">Filters</span>
                  {(selectedCategory !== 'all' || selectedStore !== 'all' || searchTerm || selectedMaterials.length > 0) && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                      {selectedMaterials.length + (selectedCategory !== 'all' ? 1 : 0) + (selectedStore !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-blue-600 flex items-center gap-1"
                >
                  {showFilters ? <FaTimes /> : 'Show'}
                </button>
              </div>
              
              {/* Quick Search on Mobile */}
              <div className="mt-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar - Filters (Desktop always visible, Mobile conditional) */}
            <div className={`
              lg:w-1/4 transition-all duration-300
              ${showFilters ? 'block' : 'hidden lg:block'}
              fixed lg:relative inset-0 lg:inset-auto z-30 lg:z-auto
              bg-white lg:bg-transparent
              w-full lg:w-auto
              top-0 lg:top-auto
              overflow-y-auto lg:overflow-visible
              h-full lg:h-auto
            `}>
              {/* Mobile Filter Header */}
              <div className="lg:hidden sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="font-semibold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-2">
                  <FaTimes />
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-base sm:text-lg">Filters</h3>
                  <button onClick={clearFilters} className="text-xs sm:text-sm text-blue-600 hover:text-blue-800">
                    Clear All
                  </button>
                </div>
                
                {/* Search - Desktop only */}
                <div className="mb-6 hidden lg:block">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                
                {/* Stores Filter */}
                {stores.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                      <FaStore /> Stores
                    </h4>
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="all">All Stores</option>
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>{store.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Categories */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Categories</h4>
                  <div className="space-y-2">
                    {['all', 'carpet', 'textile'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cat === 'all' ? 'All Products' : cat === 'carpet' ? '🪑 Carpets' : '🧵 Textiles'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Price Range (EGP)</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-1/2 px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-1/2 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                
                {/* Materials */}
                {availableMaterials.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Material</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {availableMaterials.map(material => (
                        <label key={material} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={selectedMaterials.includes(material)}
                            onChange={() => toggleMaterial(material)}
                            className="rounded"
                          />
                          <span className="capitalize">{material}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid/List */}
            <div className="flex-1">
              {/* Sort and Layout Bar */}
              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Results Count */}
                  <div className="text-xs sm:text-sm text-gray-500 order-1 sm:order-none">
                    Showing {paginatedProducts.length} of {filteredProducts.length} products
                  </div>
                  
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2 order-3 sm:order-none w-full sm:w-auto">
                    <FaSort className="text-gray-400 text-sm" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 sm:flex-none px-3 py-1.5 border rounded-lg text-sm bg-white"
                    >
                      <option value="newest">Newest</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="popular">Most Popular</option>
                      <option value="rating">Top Rated</option>
                    </select>
                  </div>
                  
                  {/* Layout Toggle */}
                  <div className="flex gap-1 order-2 sm:order-none">
                    <button
                      onClick={() => setLayoutMode('grid')}
                      className={`p-2 rounded-lg transition ${layoutMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                      title="Grid view"
                    >
                      <FaTh size={14} />
                    </button>
                    <button
                      onClick={() => setLayoutMode('list')}
                      className={`p-2 rounded-lg transition ${layoutMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                      title="List view"
                    >
                      <FaList size={14} />
                    </button>
                  </div>
                  
                  {/* Mobile Filter Trigger */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm order-4 sm:order-none"
                  >
                    <FaFilter /> Filter
                  </button>
                </div>
              </div>

              {/* No Results */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-gray-500">No products found matching your criteria.</p>
                  <button onClick={clearFilters} className="mt-4 text-blue-600 hover:text-blue-800">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Products Container - متجاوب */}
                  <div className={`
                    ${layoutMode === 'grid' 
                      ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6' 
                      : 'space-y-3 sm:space-y-4'
                    }
                  `}>
                    {paginatedProducts.map(product => {
                      const store = stores.find(s => s._id === product.storeId);
                      return (
                        <div key={product._id} className={getProductCardClass()}>
                          <div className={layoutMode === 'list' ? 'flex' : ''}>
                            {/* Product Image */}
                            <Link to={`/product/${product.slug}`} className={`${getImageContainerClass()} relative block`}>
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl sm:text-6xl bg-gray-100">
                                  🧵
                                </div>
                              )}
                              {product.discount > 0 && (
                                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                                  {product.discount}% OFF
                                </span>
                              )}
                              {product.isNew && (
                                <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                                  New
                                </span>
                              )}
                            </Link>
                            
                            {/* Product Info */}
                            <div className={`p-3 sm:p-4 flex-1 ${layoutMode === 'list' ? 'flex flex-col justify-between' : ''}`}>
                              {/* Store Name */}
                              {store && (
                                <Link to={`/shop/${store.slug}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mb-1 sm:mb-2">
                                  <FaStore size={10} /> 
                                  <span className="truncate max-w-[100px]">{store.name}</span>
                                </Link>
                              )}
                              
                              {/* Rating */}
                              <div className="flex items-center gap-1 mb-1 flex-wrap">
                                {renderStars(product.rating)}
                                <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
                              </div>
                              
                              {/* Title */}
                              <Link to={`/product/${product.slug}`}>
                                <h3 className="font-semibold text-sm sm:text-base hover:text-blue-600 transition line-clamp-2">
                                  {product.name}
                                </h3>
                              </Link>
                              
                              {/* Details */}
                              <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-1">
                                {product.material} {product.size && `| ${product.size}`}
                              </p>
                              
                              {/* Price */}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-base sm:text-xl font-bold text-blue-600">
                                  {product.price.toLocaleString()} EGP
                                </span>
                                {product.oldPrice > 0 && (
                                  <span className="text-xs sm:text-sm text-gray-400 line-through">
                                    {product.oldPrice.toLocaleString()} EGP
                                  </span>
                                )}
                              </div>
                              
                              {/* Stock */}
                              <div className={`text-xs mt-1 ${product.quantity < 10 ? 'text-red-500' : 'text-green-600'}`}>
                                {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                              </div>
                              
                              {/* Actions */}
                              {product.quantity > 0 && (
                                <div className={`flex items-center justify-between mt-3 sm:mt-4 ${layoutMode === 'list' ? 'mt-2' : ''}`}>
                                  <div className="flex items-center gap-1 sm:gap-2 border rounded-lg">
                                    <button 
                                      onClick={() => updateQuantity(product._id, -1)} 
                                      className="px-2 sm:px-3 py-1 hover:bg-gray-100"
                                      aria-label="Decrease quantity"
                                    >
                                      <FaMinus size={10} className="sm:text-xs" />
                                    </button>
                                    <span className="w-6 sm:w-8 text-center text-sm">{quantities[product._id]}</span>
                                    <button 
                                      onClick={() => updateQuantity(product._id, 1)} 
                                      className="px-2 sm:px-3 py-1 hover:bg-gray-100"
                                      aria-label="Increase quantity"
                                    >
                                      <FaPlus size={10} className="sm:text-xs" />
                                    </button>
                                  </div>
                                  <button 
                                    onClick={() => handleAddToCart(product)} 
                                    className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 hover:bg-blue-700 text-xs sm:text-sm"
                                  >
                                    <FaShoppingCart size={12} className="sm:text-sm" /> 
                                    <span className="hidden xs:inline">Add</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination - متجاوب */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6 sm:mt-8">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-2 sm:px-3 py-1 sm:py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <FaChevronRight className="inline" size={12} /> Prev
                        </button>
                        
                        {/* Show limited page numbers on mobile */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            if (windowWidth < 640) {
                              return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                            }
                            return page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2);
                          })
                          .map((page, idx, array) => (
                            <React.Fragment key={page}>
                              {idx > 0 && array[idx - 1] !== page - 1 && (
                                <span className="px-2 py-1 sm:py-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => goToPage(page)}
                                className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition text-sm ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'border hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))}
                        
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-2 sm:px-3 py-1 sm:py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Next <FaChevronLeft className="inline" size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Stores View - متجاوب */}
        {viewMode === 'stores' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {stores.map(store => (
              <Link to={`/shop/${store.slug}`} key={store._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group">
                <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                  {store.coverImage && (
                    <img src={store.coverImage} alt={store.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute -bottom-6 left-3 sm:left-4">
                    {store.logo ? (
                      <img src={store.logo} alt={store.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white bg-white object-cover" />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white bg-white flex items-center justify-center">
                        <FaStore className="text-blue-600 text-xl sm:text-2xl" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3 sm:p-4 pt-8 sm:pt-10">
                  <h3 className="font-semibold text-base sm:text-lg group-hover:text-blue-600 transition line-clamp-1">
                    {store.name}
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-500">
                    <span>{store.stats?.totalProducts || 0} products</span>
                    <span>•</span>
                    <span>{store.stats?.totalSales || 0} sales</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 sm:mt-2">
                    {renderStars(store.stats?.averageRating)}
                    <span className="text-xs text-gray-500">({store.stats?.totalReviews || 0})</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">
                    {store.description || 'No description yet.'}
                  </p>
                  <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FaTruck size={12} /> Free shipping over {store.settings?.freeShippingThreshold?.toLocaleString()} EGP
                    </div>
                    <span className="text-xs text-blue-600 group-hover:underline">Visit →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Mobile Filter Overlay */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};

export default Shop;