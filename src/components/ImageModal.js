import React, { useState, useEffect, useRef } from 'react';
import { 
    FaTimes, FaExpand, FaCompress, FaDownload, FaShare, 
    FaHeart, FaRegHeart, FaBookmark, FaRegBookmark,
    FaInfoCircle, FaTrash, FaEdit, FaPrint, 
    FaTwitter, FaFacebook, FaWhatsapp, FaLink,
    FaSyncAlt, FaUndo, FaRedoAlt,
    FaChevronLeft, FaChevronRight, FaTh, FaExpandArrowsAlt,
    FaSearchPlus, FaSearchMinus, FaEye, FaEyeSlash
} from 'react-icons/fa';

const ImageModal = ({ 
    imageUrl, 
    images = [], 
    currentIndex = 0, 
    onClose, 
    onNext, 
    onPrev, 
    allowDownload = true, 
    allowShare = true 
}) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [showFilters, setShowFilters] = useState(false);
    
    const containerRef = useRef(null);
    const imageRef = useRef(null);
    
    const imageList = images.length > 0 ? images : [imageUrl];
    const currentImage = imageList[currentIndex] || imageUrl;

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'auto';
        };
    }, [onClose]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft' && onPrev && imageList.length > 1) {
                onPrev();
                resetTransformations();
            } else if (e.key === 'ArrowRight' && onNext && imageList.length > 1) {
                onNext();
                resetTransformations();
            } else if (e.key === 'f') {
                toggleFullscreen();
            } else if (e.key === 'z') {
                handleZoomIn();
            } else if (e.key === 'Z') {
                handleZoomOut();
            } else if (e.key === 'r') {
                resetTransformations();
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onPrev, onNext, imageList.length]);

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const resetTransformations = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
        setIsFlipped(false);
        setBrightness(100);
        setContrast(100);
    };

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleMouseDown = (e) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        
        if (!isFullscreen) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const downloadImage = async () => {
        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image-${Date.now()}.jpg`;
            a.click();
            URL.revokeObjectURL(url);
            showTempMessage('✅ Image downloaded');
        } catch (error) {
            showTempMessage('❌ Download failed');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(currentImage);
        showTempMessage('🔗 Link copied to clipboard');
    };

    const shareToSocial = (platform) => {
        const url = encodeURIComponent(currentImage);
        const text = encodeURIComponent('Check out this amazing image!');
        
        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`
        };
        
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        showTempMessage(`📤 Sharing to ${platform}`);
    };

    const showTempMessage = (message) => {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = message;
        tempDiv.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-[60] pointer-events-none whitespace-nowrap';
        document.body.appendChild(tempDiv);
        setTimeout(() => tempDiv.remove(), 2000);
    };

    const getTransformStyle = () => {
        let transform = `scale(${scale}) rotate(${rotation}deg)`;
        if (isFlipped) transform += ` scaleX(-1)`;
        if (scale > 1) transform += ` translate(${position.x}px, ${position.y}px)`;
        return transform;
    };

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent z-10">
                <div className="flex justify-between items-center p-4">
                    {/* Left side - Counter */}
                    <div className="flex items-center gap-3">
                        {imageList.length > 1 && (
                            <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                {currentIndex + 1} / {imageList.length}
                            </span>
                        )}
                    </div>
                    
                    {/* Right side - Actions */}
                    <div className="flex items-center gap-2">
                        {/* Like Button */}
                        <button
                            onClick={() => setIsLiked(!isLiked)}
                            className="text-white hover:text-red-500 transition p-2 rounded-full hover:bg-white/10"
                            title={isLiked ? 'Unlike' : 'Like'}
                        >
                            {isLiked ? <FaHeart className="text-red-500" size={20} /> : <FaRegHeart size={20} />}
                        </button>
                        
                        {/* Save Button */}
                        <button
                            onClick={() => setIsSaved(!isSaved)}
                            className="text-white hover:text-blue-500 transition p-2 rounded-full hover:bg-white/10"
                            title={isSaved ? 'Saved' : 'Save'}
                        >
                            {isSaved ? <FaBookmark className="text-blue-500" size={18} /> : <FaRegBookmark size={18} />}
                        </button>
                        
                        {/* Download */}
                        {allowDownload && (
                            <button
                                onClick={downloadImage}
                                className="text-white hover:text-green-500 transition p-2 rounded-full hover:bg-white/10"
                                title="Download"
                            >
                                <FaDownload size={18} />
                            </button>
                        )}
                        
                        {/* Share */}
                        {allowShare && (
                            <div className="relative group">
                                <button
                                    className="text-white hover:text-blue-500 transition p-2 rounded-full hover:bg-white/10"
                                    title="Share"
                                >
                                    <FaShare size={18} />
                                </button>
                                <div className="absolute right-0 top-full mt-2 bg-black/90 rounded-lg p-2 hidden group-hover:block z-20 min-w-[160px]">
                                    <button onClick={() => shareToSocial('facebook')} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/20 rounded-lg flex items-center gap-2">
                                        <FaFacebook /> Facebook
                                    </button>
                                    <button onClick={() => shareToSocial('twitter')} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/20 rounded-lg flex items-center gap-2">
                                        <FaTwitter /> Twitter
                                    </button>
                                    <button onClick={() => shareToSocial('whatsapp')} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/20 rounded-lg flex items-center gap-2">
                                        <FaWhatsapp /> WhatsApp
                                    </button>
                                    <button onClick={copyToClipboard} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/20 rounded-lg flex items-center gap-2">
                                        <FaLink /> Copy Link
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Info Button */}
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className="text-white hover:text-blue-500 transition p-2 rounded-full hover:bg-white/10"
                            title="Info"
                        >
                            <FaInfoCircle size={18} />
                        </button>
                        
                        {/* Filters */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-white hover:text-purple-500 transition p-2 rounded-full hover:bg-white/10"
                            title="Adjust Image"
                        >
                            <FaExpandArrowsAlt size={18} />
                        </button>
                        
                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="text-white hover:text-blue-500 transition p-2 rounded-full hover:bg-white/10"
                            title="Fullscreen (F)"
                        >
                            {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
                        </button>
                        
                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="text-white hover:text-red-500 transition p-2 rounded-full hover:bg-white/10"
                            title="Close (ESC)"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Image Navigation Arrows */}
            {imageList.length > 1 && (
                <>
                    <button
                        onClick={() => { onPrev?.(); resetTransformations(); }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition z-10"
                        title="Previous (←)"
                    >
                        <FaChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => { onNext?.(); resetTransformations(); }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition z-10"
                        title="Next (→)"
                    >
                        <FaChevronRight size={24} />
                    </button>
                </>
            )}
            
            {/* Bottom Toolbar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pb-6 pt-12 z-10">
                <div className="flex justify-center gap-3">
                    {/* Zoom Out */}
                    <button
                        onClick={handleZoomOut}
                        className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                        title="Zoom Out (Shift+Z)"
                    >
                        <FaSearchMinus size={18} />
                    </button>
                    
                    {/* Zoom In */}
                    <button
                        onClick={handleZoomIn}
                        className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                        title="Zoom In (Z)"
                    >
                        <FaSearchPlus size={18} />
                    </button>
                    
                    {/* Rotate */}
                    <button
                        onClick={handleRotate}
                        className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                        title="Rotate"
                    >
                        <FaSyncAlt size={18} />
                    </button>
                    
                    {/* Flip */}
                    <button
                        onClick={handleFlip}
                        className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                        title="Flip Horizontal"
                    >
                        <FaRedoAlt size={18} />
                    </button>
                    
                    {/* Reset */}
                    <button
                        onClick={resetTransformations}
                        className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                        title="Reset (R)"
                    >
                        <FaUndo size={18} />
                    </button>
                    
                    {/* Thumbnails */}
                    {imageList.length > 1 && (
                        <button
                            onClick={() => setShowThumbnails(!showThumbnails)}
                            className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                            title="Show Thumbnails"
                        >
                            <FaTh size={18} />
                        </button>
                    )}
                </div>
            </div>
            
            {/* Image Filters Panel */}
            {showFilters && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/90 rounded-xl p-4 z-20 min-w-[300px]">
                    <div className="space-y-3">
                        <div>
                            <label className="text-white text-sm block mb-1">Brightness: {brightness}%</label>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={brightness}
                                onChange={(e) => setBrightness(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-white text-sm block mb-1">Contrast: {contrast}%</label>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={contrast}
                                onChange={(e) => setContrast(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}
            
            {/* Info Panel */}
            {showInfo && (
                <div className="absolute bottom-20 left-4 bg-black/90 rounded-xl p-4 z-20 max-w-sm">
                    <div className="space-y-2 text-sm text-white">
                        <p><strong>📷 Image Info</strong></p>
                        <p>Size: {imageList.length > 1 ? `${currentIndex + 1} of ${imageList.length}` : 'Single image'}</p>
                        <p>Zoom: {Math.round(scale * 100)}%</p>
                        <p>Rotation: {rotation}°</p>
                        <p>Flipped: {isFlipped ? 'Yes' : 'No'}</p>
                        <p className="text-xs text-gray-400 mt-2">💡 Tip: Click and drag to pan when zoomed</p>
                        <p className="text-xs text-gray-400">⌨️ Keyboard: ←/→ Navigate | Z Zoom | R Reset | F Fullscreen</p>
                    </div>
                </div>
            )}
            
            {/* Thumbnails Strip */}
            {showThumbnails && imageList.length > 1 && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/90 rounded-xl p-3 z-20">
                    <div className="flex gap-2 overflow-x-auto max-w-[80vw]">
                        {imageList.map((img, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (idx < currentIndex) onPrev?.();
                                    else if (idx > currentIndex) onNext?.();
                                    resetTransformations();
                                }}
                                className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer transition border-2 ${
                                    idx === currentIndex ? 'border-blue-500 scale-105' : 'border-transparent hover:border-white/50'
                                }`}
                            >
                                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Main Image */}
            <div 
                className="flex-1 flex items-center justify-center overflow-hidden"
                onMouseDown={handleMouseDown}
                style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
                <img
                    ref={imageRef}
                    src={currentImage}
                    alt="Full size"
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{
                        transform: getTransformStyle(),
                        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease'
                    }}
                    draggable={false}
                />
            </div>
        </div>
    );
};

export default ImageModal;