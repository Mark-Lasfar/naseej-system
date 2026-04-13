import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FaTruck, FaShippingFast, FaBuilding, FaMobileAlt, 
  FaCreditCard, FaLink, FaPlus, FaTrash, FaCheckCircle,
  FaExclamationTriangle, FaSync, FaPlug, FaExternalLinkAlt,
  FaWhatsapp, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt,
  FaClock, FaShieldAlt, FaMoneyBillWave, FaArrowRight,
  FaCopy, FaKey, FaUserSecret, FaDatabase, FaRobot
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

// بيانات خدمات التكامل مع شرح كامل لكل خدمة - باستخدام الصور المحلية
const INTEGRATION_SERVICES = [
  {
    id: 'bosta',
    name: 'Bosta (أوصل)',
    icon: <FaTruck className="text-green-600 text-4xl" />,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'شحن سريع لجميع أنحاء مصر مع تتبع الطلبات لحظة بلحظة',
    longDescription: 'Bosta هي منصة الشحن الرائدة في مصر، توفر خدمات توصيل سريعة وموثوقة لجميع المحافظات مع إمكانية تتبع الطلب لحظة بلحظة.',
    benefits: [
      '🚚 توصيل سريع خلال 24-48 ساعة',
      '📍 تغطية جميع محافظات مصر',
      '📱 تطبيق لتتبع الطلبات',
      '💰 أسعار تنافسية',
      '🔄 تكامل تلقائي مع متجرك'
    ],
    steps: [
      'قم بزيارة موقع Bosta وسجل حساب جديد كتاجر',
      'اطلب API Keys من لوحة التحكم',
      'انسخ الـ API Key والصقه في الحقل أدناه',
      'فعّل التكامل وابدأ في إرسال الطلبات'
    ],
    apiDocs: 'https://docs.bosta.co',
    registrationUrl: 'https://bosta.co/merchant-register',
    localImage: '/bosta.svg',
    requiresApiSecret: true,
    settings: {
      autoSyncProducts: true,
      autoSyncOrders: true,
      autoSyncInventory: true,
      shippingRate: 35,
      freeShippingThreshold: 500
    }
  },
  {
    id: 'talabat',
    name: 'Talabat Orders',
    icon: <FaShippingFast className="text-orange-600 text-4xl" />,
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'عرض منتجاتك على منصة طلبات والوصول لملايين العملاء',
    longDescription: 'طلبات هي أكبر منصة لتوصيل الطعام والطلبات في الشرق الأوسط. يمكنك عرض منتجاتك على المنصة والوصول لملايين العملاء.',
    benefits: [
      '📱 وصول لأكثر من 5 ملايين مستخدم',
      '💰 زيادة المبيعات بنسبة تصل إلى 40%',
      '🎯 استهداف دقيق للعملاء',
      '📊 تقارير وإحصائيات متقدمة'
    ],
    steps: [
      'تواصل مع فريق Talabat للتسجيل كتاجر',
      'وقع العقد واحصل على API Keys',
      'أضف الـ API Key في الحقل أدناه',
      'سيتم مزامنة منتجاتك تلقائياً'
    ],
    apiDocs: 'https://developer.talabat.com',
    registrationUrl: 'https://talabat.com/merchant',
    localImage: '/talabat.svg',
    requiresApiSecret: true,
    settings: {
      autoSyncProducts: true,
      autoSyncOrders: true,
      commission: 15
    }
  },
  {
    id: 'fatura',
    name: 'Fatura (فاتورة)',
    icon: <FaBuilding className="text-blue-600 text-4xl" />,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'إصدار فواتير إلكترونية متوافقة مع قانون الفاتورة الإلكترونية',
    longDescription: 'Fatura هي منصة رائدة للفواتير الإلكترونية في مصر، متوافقة 100% مع متطلبات مصلحة الضرائب المصرية.',
    benefits: [
      '✅ متوافق مع قانون الفاتورة الإلكترونية',
      '📄 إصدار فواتير ضريبية رسمية',
      '🔗 ربط مباشر مع مصلحة الضرائب',
      '📊 تقارير ضريبية مفصلة'
    ],
    steps: [
      'سجل في منصة Fatura كتاجر',
      'احصل على API Keys من لوحة التحكم',
      'أدخل المفاتيح أدناه',
      'سيتم إصدار الفواتير تلقائياً لكل طلب'
    ],
    apiDocs: 'https://docs.fatura.io',
    registrationUrl: 'https://fatura.ma/signup',
    localImage: '/fatura.png',
    requiresApiSecret: true,
    settings: {
      autoSyncInvoices: true,
      taxRate: 14
    }
  },
  {
    id: 'paymob',
    name: 'Paymob',
    icon: <FaCreditCard className="text-purple-600 text-4xl" />,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'بوابة دفع إلكترونية متكاملة تقبل جميع وسائل الدفع',
    longDescription: 'Paymob هي منصة المدفوعات الرقمية الرائدة في مصر، تقبل الدفع بكل وسائل الدفع (بطاقات ائتمان، محافظ إلكترونية، تحويلات بنكية).',
    benefits: [
      '💳 قبول جميع طرق الدفع',
      '📱 دفع عبر المحافظ الإلكترونية',
      '🔒 أمان عالي وحماية من الاحتيال',
      '💰 تحويل سريع للأموال'
    ],
    steps: [
      'سجل في Paymob كتاجر',
      'احصل على API Keys من لوحة التحكم',
      'أضف المفاتيح أدناه',
      'سيتم تفعيل الدفع الإلكتروني تلقائياً'
    ],
    apiDocs: 'https://docs.paymob.com',
    registrationUrl: 'https://paymob.com/merchant-register',
    localImage: '/paymob.png',
    requiresApiSecret: true,
    settings: {
      autoSyncPayments: true,
      commission: 2.5
    }
  },
  {
    id: 'vodafone_cash',
    name: 'Vodafone Cash',
    icon: <FaMobileAlt className="text-red-600 text-4xl" />,
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'استقبل مدفوعات Vodafone Cash تلقائياً',
    longDescription: 'Vodafone Cash هي أكبر محفظة إلكترونية في مصر. يمكنك استقبال المدفوعات مباشرة من عملائك.',
    benefits: [
      '📱 أكثر من 10 ملايين مستخدم',
      '💰 تحويل فوري للأموال',
      '🔄 تكامل تلقائي مع الطلبات',
      '✅ تأكيد الدفع لحظياً'
    ],
    steps: [
      'فعّل خدمة Vodafone Cash لرقم هاتفك',
      'أدخل رقم هاتف Vodafone Cash أدناه',
      'سيظهر رقم هاتفك للعملاء عند الدفع',
      'سيتم تأكيد الدفع تلقائياً'
    ],
    apiDocs: 'https://business.vodafone.com.eg/vodafone-cash-api',
    registrationUrl: 'https://business.vodafone.com.eg',
    localImage: '/vodafon.svg',
    requiresApiSecret: false,
    settings: {
      merchantPhone: '',
      autoConfirmPayments: true
    }
  },
  {
    id: 'instapay',
    name: 'InstaPay',
    icon: <FaMobileAlt className="text-green-600 text-4xl" />,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'تحويلات بنكية فورية عبر InstaPay',
    longDescription: 'InstaPay هي خدمة التحويلات البنكية الفورية من البنك المركزي المصري.',
    benefits: [
      '🏦 تحويلات بنكية فورية',
      '💰 عمولات منخفضة',
      '🔒 آمنة ومعتمدة من البنك المركزي',
      '📱 سهلة الاستخدام'
    ],
    steps: [
      'فعّل خدمة InstaPay على حسابك البنكي',
      'أدخل رقم الهاتف المرتبط بالخدمة',
      'سيظهر رقم هاتفك للعملاء',
      'سيتم تأكيد التحويلات تلقائياً'
    ],
    apiDocs: 'https://instapay.gov.eg/developer',
    registrationUrl: 'https://instapay.gov.eg',
    localImage: '/instapay.png',
    requiresApiSecret: false,
    settings: {
      merchantPhone: '',
      bankName: '',
      accountNumber: ''
    }
  }
];

const SellerIntegrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceDetails, setShowServiceDetails] = useState(null);
  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
    merchantPhone: '',
    bankName: '',
    accountNumber: '',
    settings: {}
  });
  const [copiedField, setCopiedField] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await axios.get(`${API_URL}/integrations`);
      setIntegrations(response.data);
    } catch (error) {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = async (e) => {
    e.preventDefault();
    try {
      const service = INTEGRATION_SERVICES.find(s => s.id === selectedService);
      const payload = {
        service: selectedService,
        apiKey: formData.apiKey,
        apiSecret: formData.apiSecret,
        settings: {
          ...service.settings,
          ...formData.settings,
          merchantPhone: formData.merchantPhone,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber
        }
      };
      
      await axios.post(`${API_URL}/integrations`, payload);
      toast.success(`${service.name} connected successfully!`);
      setShowModal(false);
      fetchIntegrations();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to connect service');
    }
  };

  const handleDeleteIntegration = async (id, serviceName) => {
    if (window.confirm(`Are you sure you want to disconnect ${serviceName}?`)) {
      try {
        await axios.delete(`${API_URL}/integrations/${id}`);
        toast.success(`${serviceName} disconnected`);
        fetchIntegrations();
      } catch (error) {
        toast.error('Failed to disconnect');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      apiKey: '',
      apiSecret: '',
      merchantPhone: '',
      bankName: '',
      accountNumber: '',
      settings: {}
    });
    setSelectedService(null);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleImageError = (serviceId) => {
    setImageErrors(prev => ({ ...prev, [serviceId]: true }));
  };

  const getIntegrationStatus = (integration) => {
    const service = INTEGRATION_SERVICES.find(s => s.id === integration.service);
    const isActive = integration.status === 'active';
    
    return (
      <div className="flex items-center gap-2">
        {isActive ? (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <FaCheckCircle className="text-green-500" /> Connected
          </span>
        ) : (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <FaExclamationTriangle /> Pending
          </span>
        )}
      </div>
    );
  };

  // عرض الصورة مع fallback
  const ServiceImage = ({ service }) => {
    const [imgError, setImgError] = useState(false);
    
    if (imgError || !service.localImage) {
      return (
        <div className={`w-14 h-14 ${service.bgColor} rounded-xl flex items-center justify-center`}>
          {service.icon}
        </div>
      );
    }
    
    return (
      <img 
        src={service.localImage} 
        alt={service.name}
        className="w-14 h-14 object-contain rounded-xl"
        onError={() => setImgError(true)}
      />
    );
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
        <div>
          <h1 className="text-2xl font-bold">🔌 Integrations</h1>
          <p className="text-gray-500 text-sm mt-1">Connect your store with shipping, payment, and logistics services</p>
        </div>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaCheckCircle className="text-green-500" /> Connected Services ({integrations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map(integration => {
              const service = INTEGRATION_SERVICES.find(s => s.id === integration.service);
              if (!service) return null;
              
              return (
                <motion.div
                  key={integration._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-xl shadow-sm border-2 ${service.borderColor} p-4 hover:shadow-md transition`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <ServiceImage service={service} />
                      <div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <p className="text-sm text-gray-500">{service.description}</p>
                      </div>
                    </div>
                    {getIntegrationStatus(integration)}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex flex-wrap gap-2">
                      {integration.settings?.autoSyncProducts && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">🔄 Auto Sync Products</span>
                      )}
                      {integration.settings?.autoSyncOrders && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">📦 Auto Sync Orders</span>
                      )}
                      {integration.settings?.autoSyncInventory && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">📊 Auto Sync Inventory</span>
                      )}
                      {integration.settings?.autoSyncInvoices && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">📄 Auto Sync Invoices</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end gap-3">
                    <button 
                      onClick={() => setShowServiceDetails(service)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <FaExternalLinkAlt size={12} /> View Details
                    </button>
                    <button 
                      onClick={() => handleDeleteIntegration(integration._id, service.name)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Services Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaPlug className="text-blue-500" /> Available Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INTEGRATION_SERVICES.map(service => {
            const isConnected = integrations.some(i => i.service === service.id);
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className={`bg-white rounded-xl shadow-sm border-2 ${service.borderColor} overflow-hidden hover:shadow-lg transition-all duration-300 ${isConnected ? 'opacity-60' : ''}`}
              >
                <div className={`${service.bgColor} p-4 flex items-center gap-3`}>
                  <ServiceImage service={service} />
                  <div>
                    <h3 className="font-bold text-lg">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-3">{service.longDescription.substring(0, 100)}...</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {service.benefits.slice(0, 2).map((benefit, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {benefit.substring(0, 30)}...
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowServiceDetails(service)}
                      className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg text-sm hover:bg-blue-50 transition flex items-center justify-center gap-1"
                    >
                      <FaExternalLinkAlt size={12} /> Learn More
                    </button>
                    {!isConnected && (
                      <button
                        onClick={() => {
                          setSelectedService(service.id);
                          setShowModal(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg text-sm hover:shadow-lg transition flex items-center justify-center gap-1"
                      >
                        <FaPlug size={12} /> Connect
                      </button>
                    )}
                    {isConnected && (
                      <button
                        disabled
                        className="flex-1 bg-gray-200 text-gray-500 py-2 rounded-lg text-sm cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <FaCheckCircle size={12} /> Connected
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Service Details Modal */}
      <AnimatePresence>
        {showServiceDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className={`sticky top-0 ${showServiceDetails.bgColor} p-6 border-b`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <ServiceImage service={showServiceDetails} />
                    <div>
                      <h2 className="text-2xl font-bold">{showServiceDetails.name}</h2>
                      <p className="text-gray-600">{showServiceDetails.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowServiceDetails(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Full Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">About {showServiceDetails.name}</h3>
                  <p className="text-gray-600 leading-relaxed">{showServiceDetails.longDescription}</p>
                </div>
                
                {/* Benefits */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FaShieldAlt className="text-green-500" /> Benefits
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {showServiceDetails.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-600">
                        <FaCheckCircle className="text-green-500 text-sm" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* How to Connect */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FaUserSecret className="text-blue-500" /> How to Connect
                  </h3>
                  <div className="space-y-3">
                    {showServiceDetails.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-gray-600">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Registration Links */}
                <div className={`p-4 rounded-xl ${showServiceDetails.bgColor}`}>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FaLink className="text-blue-500" /> Registration & API Keys
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm text-gray-600">Registration URL:</span>
                      <a 
                        href={showServiceDetails.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        {showServiceDetails.registrationUrl} <FaExternalLinkAlt size={12} />
                      </a>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm text-gray-600">API Documentation:</span>
                      <a 
                        href={showServiceDetails.apiDocs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        {showServiceDetails.apiDocs} <FaExternalLinkAlt size={12} />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowServiceDetails(null);
                      setSelectedService(showServiceDetails.id);
                      setShowModal(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <FaPlug /> Connect {showServiceDetails.name}
                  </button>
                  <button
                    onClick={() => setShowServiceDetails(null)}
                    className="flex-1 bg-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Integration Modal */}
      <AnimatePresence>
        {showModal && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full"
            >
              {(() => {
                const service = INTEGRATION_SERVICES.find(s => s.id === selectedService);
                if (!service) return null;
                
                return (
                  <>
                    <div className={`${service.bgColor} p-6 rounded-t-2xl border-b`}>
                      <div className="flex items-center gap-3">
                        <ServiceImage service={service} />
                        <div>
                          <h2 className="text-xl font-bold">Connect {service.name}</h2>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <form onSubmit={handleAddIntegration} className="p-6 space-y-4">
                      {/* API Key Field */}
                      {service.requiresApiSecret !== false && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                              <FaKey className="text-gray-400" /> API Key
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={formData.apiKey}
                                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-24"
                                placeholder="Enter your API Key"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => copyToClipboard(formData.apiKey, 'apiKey')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <FaCopy />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              You can find your API Key in {service.name} dashboard → Developers → API Keys
                            </p>
                          </div>
                          
                          {/* API Secret Field */}
                          <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                              <FaUserSecret className="text-gray-400" /> API Secret
                            </label>
                            <div className="relative">
                              <input
                                type="password"
                                value={formData.apiSecret}
                                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-24"
                                placeholder="Enter your API Secret"
                              />
                              <button
                                type="button"
                                onClick={() => copyToClipboard(formData.apiSecret, 'apiSecret')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <FaCopy />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Phone Number Field (Vodafone Cash / InstaPay) */}
                      {(selectedService === 'vodafone_cash' || selectedService === 'instapay') && (
                        <div>
                          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                            <FaPhoneAlt className="text-gray-400" /> Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.merchantPhone}
                            onChange={(e) => setFormData({ ...formData, merchantPhone: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 010XXXXXXXX"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This is the phone number where customers will send payments
                          </p>
                        </div>
                      )}
                      
                      {/* Bank Details (InstaPay) */}
                      {selectedService === 'instapay' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-1">Bank Name</label>
                            <input
                              type="text"
                              value={formData.bankName}
                              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., National Bank of Egypt"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Account Number</label>
                            <input
                              type="text"
                              value={formData.accountNumber}
                              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter your bank account number"
                            />
                          </div>
                        </>
                      )}
                      
                      {/* Settings */}
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <FaRobot className="text-gray-400" /> Auto Sync Settings
                        </label>
                        <div className="space-y-2">
                          {service.settings.autoSyncProducts !== undefined && (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formData.settings.autoSyncProducts !== false}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  settings: { ...formData.settings, autoSyncProducts: e.target.checked }
                                })}
                                className="rounded"
                              />
                              <span>Auto sync products when added/updated</span>
                            </label>
                          )}
                          {service.settings.autoSyncOrders !== undefined && (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formData.settings.autoSyncOrders !== false}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  settings: { ...formData.settings, autoSyncOrders: e.target.checked }
                                })}
                                className="rounded"
                              />
                              <span>Auto sync orders when placed</span>
                            </label>
                          )}
                          {service.settings.autoSyncInventory !== undefined && (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formData.settings.autoSyncInventory !== false}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  settings: { ...formData.settings, autoSyncInventory: e.target.checked }
                                })}
                                className="rounded"
                              />
                              <span>Auto sync inventory updates</span>
                            </label>
                          )}
                        </div>
                      </div>
                      
                      {/* Support Contact */}
                      <div className={`p-3 rounded-lg ${service.bgColor} text-sm`}>
                        <p className="flex items-center gap-2 mb-1">
                          <FaWhatsapp className="text-green-600" /> Need help?
                        </p>
                        <p className="text-gray-600">
                          Contact {service.name} support or check their documentation for assistance.
                        </p>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition">
                          Connect Service
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
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerIntegrations;