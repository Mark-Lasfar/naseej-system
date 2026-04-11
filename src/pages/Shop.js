import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaShoppingCart, FaStar, FaRegStar, FaPlus, FaMinus, FaFilter, FaTimes,
  FaStore, FaHeart, FaRegHeart, FaTruck, FaShieldAlt, FaTag
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const Shop = ({ addToCart, cartItems }) => {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('products');
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedCategory, selectedStore, searchTerm, sortBy, priceRange, selectedMaterials]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      console.log('Fetched products:', response.data.length);
      
      // عرض جميع المنتجات - لا تقم بتصفية حسب status
      // لأن المنتجات القديمة ليس لها حقل status
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
    
    // Filter by store
    if (selectedStore !== 'all') {
      filtered = filtered.filter(p => p.storeId === selectedStore);
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description?.toLowerCase().includes(term) ||
        p.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Filter by price range
    if (priceRange.min) {
      filtered = filtered.filter(p => p.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(p => p.price <= Number(priceRange.max));
    }
    
    // Filter by materials
    if (selectedMaterials.length > 0) {
      filtered = filtered.filter(p => selectedMaterials.includes(p.material));
    }
    
    // Sort
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
      storeId: product.storeId
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
      stars.push(<FaStar key={i} className="text-yellow-400 text-sm" />);
    }
    for (let i = fullStars; i < 5; i++) {
      stars.push(<FaRegStar key={i} className="text-yellow-400 text-sm" />);
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
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12 mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">🛍️ Naseej Marketplace</h1>
          <p className="text-xl">Discover unique carpets and textiles from talented sellers</p>
          {/* View Toggle */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setViewMode('products')}
              className={`px-6 py-2 rounded-lg transition ${
                viewMode === 'products' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setViewMode('stores')}
              className={`px-6 py-2 rounded-lg transition ${
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

      <div className="container mx-auto px-4">
        {/* Products View */}
        {viewMode === 'products' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Filters */}
            <div className="hidden lg:block lg:w-1/4">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Filters</h3>
                  <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800">
                    Clear All
                  </button>
                </div>
                
                {/* Stores Filter */}
                {stores.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FaStore /> Stores
                    </h4>
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
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
                  <h4 className="font-medium mb-2">Categories</h4>
                  <div className="space-y-2">
                    <button onClick={() => setSelectedCategory('all')} className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                      All Products
                    </button>
                    <button onClick={() => setSelectedCategory('carpet')} className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedCategory === 'carpet' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                      🪑 Carpets
                    </button>
                    <button onClick={() => setSelectedCategory('textile')} className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedCategory === 'textile' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                      🧵 Textiles
                    </button>
                  </div>
                </div>
                
                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Price Range</h4>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} className="w-1/2 px-3 py-2 border rounded-lg" />
                    <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} className="w-1/2 px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                
                {/* Materials */}
                {availableMaterials.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Material</h4>
                    <div className="space-y-2">
                      {availableMaterials.map(material => (
                        <label key={material} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={selectedMaterials.includes(material)} onChange={() => toggleMaterial(material)} className="rounded" />
                          <span className="capitalize">{material}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Search and Sort Bar */}
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search products by name, description, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-lg">
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden px-4 py-2 border rounded-lg flex items-center gap-2">
                    <FaFilter /> Filters
                  </button>
                </div>
              </div>

              {/* Products Count */}
              <div className="mb-4 text-gray-500">
                Showing {filteredProducts.length} of {products.length} products
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-gray-500">No products found matching your criteria.</p>
                  <button onClick={clearFilters} className="mt-4 text-blue-600 hover:text-blue-800">Clear all filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => {
                    const store = stores.find(s => s._id === product.storeId);
                    return (
                      <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group">
                        {/* Product Image */}
                        <Link to={`/product/${product.slug}`} className="block h-48 overflow-hidden bg-gray-100 relative">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">🧵</div>
                          )}
                          {product.discount > 0 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              {product.discount}% OFF
                            </span>
                          )}
                          {product.isNew && (
                            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </Link>
                        
                        <div className="p-4">
                          {/* Store Name */}
                          {store && (
                            <Link to={`/shop/${store.slug}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mb-2">
                              <FaStore size={10} /> {store.name}
                            </Link>
                          )}
                          
                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-1">
                            {renderStars(product.rating)}
                            <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
                          </div>
                          
                          {/* Title */}
                          <Link to={`/product/${product.slug}`}>
                            <h3 className="font-semibold text-lg hover:text-blue-600 transition line-clamp-1">{product.name}</h3>
                          </Link>
                          
                          {/* Details */}
                          <p className="text-gray-500 text-sm mt-1 line-clamp-1">{product.material} | {product.size}</p>
                          
                          {/* Price */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xl font-bold text-blue-600">{product.price.toLocaleString()} EGP</span>
                            {product.oldPrice > 0 && (
                              <span className="text-sm text-gray-400 line-through">{product.oldPrice.toLocaleString()} EGP</span>
                            )}
                          </div>
                          
                          {/* Stock */}
                          <div className={`text-xs mt-1 ${product.quantity < 10 ? 'text-red-500' : 'text-green-600'}`}>
                            {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                          </div>
                          
                          {/* Actions */}
                          {product.quantity > 0 && (
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2 border rounded-lg">
                                <button onClick={() => updateQuantity(product._id, -1)} className="px-3 py-1 hover:bg-gray-100">
                                  <FaMinus size={12} />
                                </button>
                                <span className="w-8 text-center">{quantities[product._id]}</span>
                                <button onClick={() => updateQuantity(product._id, 1)} className="px-3 py-1 hover:bg-gray-100">
                                  <FaPlus size={12} />
                                </button>
                              </div>
                              <button onClick={() => handleAddToCart(product)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                                <FaShoppingCart size={14} /> Add
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stores View */}
        {viewMode === 'stores' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stores.map(store => (
              <Link to={`/shop/${store.slug}`} key={store._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                  {store.coverImage && (
                    <img src={store.coverImage} alt={store.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute -bottom-8 left-4">
                    {store.logo ? (
                      <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-full border-4 border-white bg-white object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-4 border-white bg-white flex items-center justify-center">
                        <FaStore className="text-blue-600 text-2xl" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 pt-10">
                  <h3 className="font-semibold text-lg group-hover:text-blue-600 transition">{store.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{store.stats?.totalProducts || 0} products</span>
                    <span>•</span>
                    <span>{store.stats?.totalSales || 0} sales</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {renderStars(store.stats?.averageRating)}
                    <span className="text-xs text-gray-500">({store.stats?.totalReviews || 0})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{store.description || 'No description yet.'}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FaTruck size={12} /> Free shipping over {store.settings?.freeShippingThreshold?.toLocaleString()} EGP
                    </div>
                    <span className="text-xs text-blue-600 group-hover:underline">Visit Store →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;