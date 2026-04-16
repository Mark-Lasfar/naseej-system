import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaHeart, FaRegHeart, FaComment, FaShare, FaTrash, FaEdit,
    FaImage, FaVideo, FaHashtag, FaGlobe, FaLock, FaUsers,
    FaClock, FaCalendarAlt, FaPlay, FaPause, FaVolumeUp,
    FaVolumeMute, FaExpand, FaThumbsUp, FaSmile, FaPaperPlane,
    FaSpinner, FaPlus, FaCamera, FaTimes, FaNewspaper, FaStore,
    FaUserFriends, FaFire, FaRocket, FaBell, FaRegBell,
    FaBookmark, FaRegBookmark, FaFilter, FaSearch, FaArrowUp,
    FaUserCircle, FaInstagram, FaTiktok, FaYoutube, FaTwitter,
    FaQuoteLeft, FaQuoteRight, FaGift, FaTrophy, FaMedal,
    FaChevronLeft, FaChevronRight, FaEllipsisH, FaCog, FaChevronDown,
    FaArrowLeft, FaArrowRight
} from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectCoverflow } from 'swiper/modules';
import imageCompression from 'browser-image-compression';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';
import VideoPlayer from '../components/VideoPlayer';
import ImageModal from '../components/ImageModal';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

// Animation variants
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.05
        }
    }
};

// دالة ضغط الصور
const compressImageFile = async (file) => {
    const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg',
        quality: 0.7
    };

    try {
        if (file.size < 1024 * 1024) {
            return file;
        }
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error('خطأ في ضغط الصورة:', error);
        return file;
    }
};

// دالة ضغط الفيديو
const compressVideoFile = async (file) => {
    if (file.size > 20 * 1024 * 1024) {
        toast.error(`Video size is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please use a smaller video (max 20MB)`);
        return null;
    }
    return file;
};

// دالة للحصول على نص الخصوصية
const getVisibilityText = (visibility) => {
    switch (visibility) {
        case 'public': return 'Public';
        case 'followers': return 'Followers only';
        case 'private': return 'Only me';
        case 'store_only': return 'Store only';
        default: return 'Public';
    }
};

// دالة للحصول على أيقونة الخصوصية
const getVisibilityIcon = (visibility) => {
    switch (visibility) {
        case 'public': return <FaGlobe className="text-green-500 text-xs" title="Public" />;
        case 'followers': return <FaUsers className="text-blue-500 text-xs" title="Followers only" />;
        case 'private': return <FaLock className="text-red-500 text-xs" title="Only me" />;
        case 'store_only': return <FaStore className="text-purple-500 text-xs" title="Store only" />;
        default: return <FaGlobe className="text-green-500 text-xs" />;
    }
};

// Component لعرض التعليقات (محدث للتجاوب)
const CommentsSection = ({ postId, onCommentAdded, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const commentsContainerRef = useRef(null);

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const response = await axios.get(`${API_URL}/posts/${postId}`);
            setComments(response.data.comments || []);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const handleSubmitComment = async () => {
        if (!commentText.trim()) return;
        if (!currentUser) {
            toast.error('Please login to comment');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/posts/${postId}/comment`, {
                content: commentText
            });
            setCommentText('');
            await fetchComments();
            if (onCommentAdded) onCommentAdded();
            toast.success('Comment added');
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingComments && comments.length === 0) {
        return <div className="text-center py-4 text-gray-400 text-sm">Loading comments...</div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm overflow-hidden flex-shrink-0">
                    {currentUser?.storeId?.logo ? (
                        <img src={currentUser.storeId.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                        currentUser?.username?.charAt(0).toUpperCase() || 'U'
                    )}
                </div>
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSubmitComment}
                        disabled={submitting}
                        className="px-3 py-2 md:px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm hover:shadow-lg transition disabled:opacity-50"
                    >
                        {submitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                    </button>
                </div>
            </div>

            {comments.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                    No comments yet. Be the first to comment!
                </div>
            ) : (
                <div ref={commentsContainerRef} className="space-y-3 max-h-64 md:max-h-96 overflow-y-auto">
                    {comments.map(comment => (
                        <div key={comment._id} className="flex gap-2">
                            <Link to={comment.userId?.storeId?.slug ? `/shop/${comment.userId.storeId.slug}` : `/shop`}>
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs overflow-hidden flex-shrink-0">
                                    {comment.userId?.storeId?.logo ? (
                                        <img src={comment.userId.storeId.logo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        comment.userId?.username?.charAt(0).toUpperCase() || 'U'
                                    )}
                                </div>
                            </Link>
                            <div className="flex-1 bg-gray-100 rounded-2xl px-3 py-2">
                                <Link to={comment.userId?.storeId?.slug ? `/shop/${comment.userId.storeId.slug}` : `/shop`} className="font-semibold text-sm hover:text-blue-600">
                                    {comment.userId?.storeId?.name || comment.userId?.username || 'Anonymous'}
                                </Link>
                                <p className="text-gray-700 text-sm mt-1 break-words">{comment.content}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span>{moment(comment.createdAt).fromNow()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Post Component محدث للتجاوب الكامل
const UserPost = ({ post, currentUser, onDelete, onVisibilityChange }) => {
    const [showComments, setShowComments] = useState(false);
    const [localPost, setLocalPost] = useState(post);
    const [liked, setLiked] = useState(post.liked || false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

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
        } catch (error) {
            toast.error('Failed to like post');
        }
    };

    const handleShare = async (platform) => {
        const url = `${window.location.origin}/post/${post._id}`;
        const text = `Check out this post: ${post.content.substring(0, 100)}...`;

        if (platform === 'copy') {
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard');
        } else if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        } else if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        } else {
            try {
                await axios.post(`${API_URL}/posts/${post._id}/share`);
                setLocalPost({
                    ...localPost,
                    sharesCount: localPost.sharesCount + 1
                });
                toast.success('Post shared!');
            } catch (error) {
                toast.error('Failed to share');
            }
        }
        setShowShareMenu(false);
    };

    const updateVisibility = async (newVisibility) => {
        setUpdatingPrivacy(true);
        try {
            const response = await axios.put(`${API_URL}/posts/${post._id}/visibility`, {
                visibility: newVisibility
            });
            setLocalPost({ ...localPost, visibility: response.data.visibility });
            toast.success(`Post visibility updated to ${getVisibilityText(newVisibility)}`);
            setShowPrivacyMenu(false);
            setShowOptionsMenu(false);
            if (onVisibilityChange) onVisibilityChange(post._id, response.data.visibility);
        } catch (error) {
            toast.error('Failed to update visibility');
        } finally {
            setUpdatingPrivacy(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await axios.delete(`${API_URL}/posts/${post._id}`);
                toast.success('Post deleted');
                if (onDelete) onDelete(post._id);
            } catch (error) {
                toast.error('Failed to delete post');
            }
        }
    };

    const nextImage = () => {
        if (localPost.media && localPost.media.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % localPost.media.length);
        }
    };

    const prevImage = () => {
        if (localPost.media && localPost.media.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + localPost.media.length) % localPost.media.length);
        }
    };

    const mediaItems = localPost.media || [];
    const isOwner = post.userId?._id === currentUser?.id;

    return (
        <>
            <motion.div
                variants={fadeInUp}
                whileHover={{ y: -2 }}
                className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 mb-4 md:mb-6 overflow-hidden"
            >
                {/* Post Header - متجاوب */}
                <div className="p-3 md:p-4 flex justify-between items-start">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <Link to={post.userId?.storeId?.slug ? `/shop/${post.userId.storeId.slug}` : `/shop`} className="flex-shrink-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-base md:text-lg font-bold shadow-md overflow-hidden">
                                {post.userId?.storeId?.logo ? (
                                    <img src={post.userId.storeId.logo} alt={post.userId?.username} className="w-full h-full object-cover" />
                                ) : (
                                    post.userId?.username?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <Link to={post.userId?.storeId?.slug ? `/shop/${post.userId.storeId.slug}` : `/shop`} className="font-semibold text-sm md:text-base hover:text-blue-600 transition truncate block">
                                {post.userId?.storeId?.name || post.userId?.username || 'Anonymous'}
                            </Link>
                            <div className="flex items-center gap-1 md:gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                                {isOwner ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                                            className="flex items-center gap-1 hover:text-gray-600"
                                            disabled={updatingPrivacy}
                                        >
                                            {getVisibilityIcon(localPost.visibility)}
                                            <span className="hidden sm:inline ml-1">{getVisibilityText(localPost.visibility)}</span>
                                            <FaChevronDown size={10} />
                                        </button>
                                        {showPrivacyMenu && (
                                            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg p-1 z-20 min-w-[140px] border">
                                                <button onClick={() => updateVisibility('public')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2">
                                                    <FaGlobe className="text-green-500" /> Public
                                                </button>
                                                <button onClick={() => updateVisibility('followers')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2">
                                                    <FaUsers className="text-blue-500" /> Followers
                                                </button>
                                                <button onClick={() => updateVisibility('private')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2">
                                                    <FaLock className="text-red-500" /> Only me
                                                </button>
                                                <button onClick={() => updateVisibility('store_only')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2">
                                                    <FaStore className="text-purple-500" /> Store only
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        {getVisibilityIcon(localPost.visibility)}
                                        <span className="hidden sm:inline">{getVisibilityText(localPost.visibility)}</span>
                                    </div>
                                )}
                                <span>•</span>
                                <span className="truncate">{moment(post.createdAt).fromNow()}</span>
                                {post.isPinned && <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">📌 Pinned</span>}
                            </div>
                        </div>
                    </div>

                    {isOwner && (
                        <div className="relative flex-shrink-0">
                            <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="text-gray-400 hover:text-gray-600 p-1">
                                <FaEllipsisH />
                            </button>
                            {showOptionsMenu && (
                                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg p-1 z-20 min-w-[140px] border">
                                    <button onClick={handleDelete} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
                                        <FaTrash /> Delete Post
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Post Content */}
                <div className="px-3 md:px-4 pb-3">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm md:text-base break-words">
                        {post.content}
                    </p>
                    {post.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 md:gap-2 mt-2 md:mt-3">
                            {post.hashtags.map(tag => (
                                <span key={tag} className="text-blue-500 text-xs md:text-sm hover:text-blue-700 cursor-pointer">#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Media Gallery - متجاوب مع Swiper */}
                {mediaItems.length > 0 && (
                    <div className="relative bg-gray-100">
                        <div className="relative">
                            {mediaItems[currentImageIndex]?.type === 'video' ? (
                                <VideoPlayer
                                    videoUrl={mediaItems[currentImageIndex].url}
                                    poster={mediaItems[currentImageIndex].thumbnail || mediaItems[currentImageIndex].url}
                                />
                            ) : (
                                <img
                                    src={mediaItems[currentImageIndex].url}
                                    alt={`Post ${currentImageIndex + 1}`}
                                    className="w-full max-h-[300px] md:max-h-[500px] object-contain cursor-pointer"
                                    onClick={() => setSelectedImage(mediaItems[currentImageIndex].url)}
                                />
                            )}
                            {mediaItems.length > 1 && (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }} 
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1.5 md:p-2 rounded-full hover:bg-black/70 transition"
                                    >
                                        <FaChevronLeft size={14} className="md:text-base" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }} 
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1.5 md:p-2 rounded-full hover:bg-black/70 transition"
                                    >
                                        <FaChevronRight size={14} className="md:text-base" />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                        {currentImageIndex + 1} / {mediaItems.length}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats Bar - متجاوب */}
                <div className="px-3 md:px-4 pt-3 pb-1 flex gap-3 md:gap-4 text-xs md:text-sm text-gray-500 border-b">
                    <span className="flex items-center gap-1"><FaHeart className="text-red-400 text-xs md:text-sm" /> {localPost.likesCount || 0} likes</span>
                    <span className="flex items-center gap-1"><FaComment className="text-xs md:text-sm" /> {localPost.commentsCount || 0} comments</span>
                    <span className="flex items-center gap-1"><FaShare className="text-xs md:text-sm" /> {localPost.sharesCount || 0} shares</span>
                </div>

                {/* Actions - متجاوب */}
                <div className="px-2 md:px-4 py-2 flex justify-around">
                    <button 
                        onClick={handleLike} 
                        className={`flex items-center gap-1 md:gap-2 py-2 px-3 md:px-6 rounded-lg transition ${liked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        {liked ? <FaHeart className="text-base md:text-lg" /> : <FaRegHeart className="text-base md:text-lg" />}
                        <span className="text-sm md:text-base">Like</span>
                    </button>
                    <button 
                        onClick={() => setShowComments(!showComments)} 
                        className="flex items-center gap-1 md:gap-2 py-2 px-3 md:px-6 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                    >
                        <FaComment className="text-base md:text-lg" />
                        <span className="text-sm md:text-base">Comment</span>
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setShowShareMenu(!showShareMenu)} 
                            className="flex items-center gap-1 md:gap-2 py-2 px-3 md:px-6 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                        >
                            <FaShare className="text-base md:text-lg" />
                            <span className="text-sm md:text-base">Share</span>
                        </button>
                        {showShareMenu && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg p-2 z-20 min-w-[140px] border">
                                <button onClick={() => handleShare('facebook')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm">📘 Facebook</button>
                                <button onClick={() => handleShare('twitter')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm">🐦 Twitter</button>
                                <button onClick={() => handleShare('whatsapp')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm">💚 WhatsApp</button>
                                <button onClick={() => handleShare('copy')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm">🔗 Copy Link</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-3 md:px-4 pb-4 pt-3 border-t bg-gray-50"
                        >
                            <CommentsSection
                                postId={post._id}
                                currentUser={currentUser}
                                onCommentAdded={() => {
                                    setLocalPost({
                                        ...localPost,
                                        commentsCount: localPost.commentsCount + 1
                                    });
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Image Modal */}
            {selectedImage && (
                <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
            )}
        </>
    );
};

// Story Circle Component - متجاوب
const StoryCircle = ({ story, onClick, currentUser }) => {
    const hasUnseen = !story.viewed;
    const isOwnStory = story.user?._id === currentUser?.id;

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onClick(story)}
            className="flex flex-col items-center cursor-pointer group flex-shrink-0"
        >
            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full p-[2px] ${hasUnseen && !isOwnStory ? 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500' : 'bg-gray-300'}`}>
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-base sm:text-lg md:text-2xl overflow-hidden">
                        {story.user?.storeId?.logo ? (
                            <img src={story.user.storeId.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                            story.user?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                    </div>
                </div>
                {isOwnStory && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                        <FaPlus size={10} className="text-white" />
                    </div>
                )}
            </div>
            <span className="text-xs mt-1 text-center line-clamp-1 max-w-[50px] sm:max-w-[60px] md:max-w-[80px]">{story.user?.storeId?.name || story.user?.username}</span>
        </motion.div>
    );
};

// Main SocialFeed Component - محدث للتجاوب الكامل
const SocialFeed = ({ user }) => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [stories, setStories] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [newPost, setNewPost] = useState({
        content: '',
        media: [],
        visibility: 'public',
        hashtags: []
    });
    const [uploading, setUploading] = useState(false);
    const [hashtagInput, setHashtagInput] = useState('');
    const [stats, setStats] = useState({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0
    });
    const fileInputRef = useRef(null);
    const feedRef = useRef(null);

    // جلب البيانات
    const fetchMyPosts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/posts/user/${user.id}`);
            setPosts(response.data.posts || []);
        } catch (error) {
            console.error('Failed to fetch my posts:', error);
            toast.error('Failed to load your posts');
        } finally {
            setLoading(false);
        }
    };

    const fetchStories = async () => {
        try {
            const response = await axios.get(`${API_URL}/stories/feed`);
            setStories(response.data || []);
        } catch (error) {
            console.error('Failed to fetch stories:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/user/stats`);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    // التعامل مع التمرير
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // جلب البيانات عند التحميل
    useEffect(() => {
        if (user) {
            fetchMyPosts();
            fetchStories();
            fetchStats();
        }
    }, [user]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.content.trim() && newPost.media.length === 0) {
            toast.error('Please add content or media');
            return;
        }
        if (!user) {
            toast.error('Please login to post');
            navigate('/login');
            return;
        }

        setUploading(true);
        try {
            const response = await axios.post(`${API_URL}/posts`, newPost);
            setPosts([response.data.post, ...posts]);
            setShowCreateModal(false);
            setNewPost({ content: '', media: [], visibility: 'public', hashtags: [] });
            toast.success('Post created successfully!');
            fetchStats();
        } catch (error) {
            toast.error('Failed to create post');
        } finally {
            setUploading(false);
        }
    };

    const uploadMedia = async (files) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        const formData = new FormData();

        for (let file of files) {
            let fileToUpload = file;
            if (file.type.startsWith('image/')) {
                const compressed = await compressImageFile(file);
                if (compressed) fileToUpload = compressed;
            } else if (file.type.startsWith('video/')) {
                const validVideo = await compressVideoFile(file);
                if (!validVideo) {
                    setUploading(false);
                    return;
                }
            }
            formData.append('media', fileToUpload);
        }

        try {
            const response = await axios.post(`${API_URL}/upload/multiple`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });

            setNewPost({ ...newPost, media: [...newPost.media, ...response.data.files] });
            toast.success(`${response.data.files.length} file(s) uploaded successfully!`);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const addHashtag = () => {
        if (hashtagInput.trim() && !newPost.hashtags.includes(hashtagInput.trim())) {
            setNewPost({ ...newPost, hashtags: [...newPost.hashtags, hashtagInput.trim()] });
            setHashtagInput('');
        }
    };

    const removeHashtag = (tag) => {
        setNewPost({ ...newPost, hashtags: newPost.hashtags.filter(t => t !== tag) });
    };

    const handleStoryClick = (story) => {
        navigate(`/stories/${story.user._id}`);
    };

    const handleDeletePost = (postId) => {
        setPosts(posts.filter(post => post._id !== postId));
        fetchStats();
    };

    const handleVisibilityChange = (postId, newVisibility) => {
        setPosts(posts.map(post =>
            post._id === postId ? { ...post, visibility: newVisibility } : post
        ));
    };

    if (loading && posts.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md mx-4">
                <div className="text-6xl mb-4">🔒</div>
                <p className="text-gray-500 text-lg">Please login to view your posts</p>
                <button
                    onClick={() => navigate('/login')}
                    className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition"
                >
                    Login
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6" ref={feedRef}>
            {/* Welcome Banner - متجاوب */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6 text-white"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h2 className="text-lg md:text-2xl font-bold">My Posts 👋</h2>
                        <p className="text-white/80 text-xs md:text-sm mt-1">Manage and view all your posts</p>
                    </div>
                    <div className="flex gap-2 md:gap-3">
                        <div className="text-center">
                            <div className="text-lg md:text-2xl font-bold">{posts.length}</div>
                            <div className="text-[10px] md:text-xs text-white/80">Posts</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg md:text-2xl font-bold">{stats.totalLikes || 0}</div>
                            <div className="text-[10px] md:text-xs text-white/80">Likes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg md:text-2xl font-bold">{stats.totalComments || 0}</div>
                            <div className="text-[10px] md:text-xs text-white/80">Comments</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stories Section - متجاوب مع تمرير أفقي */}
            {stories.length > 0 && (
                <div className="mb-6 md:mb-8">
                    <h3 className="font-semibold text-sm md:text-lg mb-2 md:mb-3 flex items-center gap-2">
                        <FaCamera className="text-purple-500 text-sm md:text-base" /> Stories
                    </h3>
                    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-thin">
                        {user && (
                            <div className="flex flex-col items-center cursor-pointer flex-shrink-0" onClick={() => setShowCreateModal(true)}>
                                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-blue-500">
                                    <FaPlus className="text-blue-500 text-lg sm:text-xl md:text-2xl" />
                                </div>
                                <span className="text-xs mt-1">Add Story</span>
                            </div>
                        )}
                        {stories.map(story => (
                            <StoryCircle key={story.user._id} story={story} onClick={handleStoryClick} currentUser={user} />
                        ))}
                    </div>
                </div>
            )}

            {/* Create Post Card - متجاوب */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-base md:text-lg font-bold overflow-hidden flex-shrink-0">
                        {user?.storeId?.logo ? (
                            <img src={user.storeId.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                            user?.username?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 text-left px-3 md:px-5 py-2 md:py-3 bg-gray-100 rounded-full text-gray-500 text-sm md:text-base hover:bg-gray-200 transition"
                    >
                        What's on your mind, {user.username}?
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 md:p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition flex-shrink-0"
                    >
                        <FaImage className="text-green-500 text-base md:text-xl" />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 md:p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition flex-shrink-0"
                    >
                        <FaVideo className="text-red-500 text-base md:text-xl" />
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            {posts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 md:py-16 bg-white rounded-xl md:rounded-2xl shadow-md"
                >
                    <div className="text-5xl md:text-7xl mb-4">📝</div>
                    <p className="text-gray-500 text-base md:text-lg">You haven't created any posts yet</p>
                    <p className="text-gray-400 text-xs md:text-sm mt-2">Share your thoughts, products, or updates with your followers!</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 md:px-6 py-2 rounded-full text-sm md:text-base hover:shadow-lg transition"
                    >
                        Create Your First Post
                    </button>
                </motion.div>
            ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate">
                    {posts.map(post => (
                        <UserPost
                            key={post._id}
                            post={post}
                            currentUser={user}
                            onDelete={handleDeletePost}
                            onVisibilityChange={handleVisibilityChange}
                        />
                    ))}
                </motion.div>
            )}

            {/* Create Post Modal - متجاوب */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-xl md:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white border-b p-3 md:p-4 flex justify-between items-center">
                                <h2 className="text-lg md:text-xl font-bold">Create Post</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <FaTimes size={18} className="md:text-xl" />
                                </button>
                            </div>

                            <form onSubmit={handleCreatePost} className="p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white overflow-hidden">
                                        {user?.storeId?.logo ? (
                                            <img src={user.storeId.logo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            user?.username?.charAt(0).toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{user?.storeId?.name || user?.username || 'Guest'}</p>
                                        <select
                                            value={newPost.visibility}
                                            onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                                            className="text-xs border rounded-lg px-2 py-1"
                                        >
                                            <option value="public">🌍 Public</option>
                                            <option value="followers">👥 Followers</option>
                                            <option value="private">🔒 Only me</option>
                                            <option value="store_only">🏪 Store only</option>
                                        </select>
                                    </div>
                                </div>

                                <textarea
                                    value={newPost.content}
                                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                    placeholder="What's on your mind?"
                                    className="w-full px-3 md:px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                                    rows="4"
                                />

                                <div>
                                    <label className="block text-sm font-medium mb-2">Add Media</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 md:px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm">
                                            <FaImage className="inline mr-1" /> Upload
                                        </button>
                                        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => uploadMedia(Array.from(e.target.files))} />
                                    </div>
                                    {uploading && (
                                        <div className="mt-2">
                                            <div className="flex justify-between text-xs md:text-sm mb-1">
                                                <span>Uploading...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-600 rounded-full h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                    {newPost.media.length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {newPost.media.map((media, idx) => (
                                                <div key={idx} className="relative w-16 h-16">
                                                    <img src={media.url} alt="Preview" className="w-full h-full object-cover rounded" />
                                                    <button type="button" onClick={() => setNewPost({ ...newPost, media: newPost.media.filter((_, i) => i !== idx) })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1">
                                                        <FaTimes size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Hashtags</label>
                                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                        <input
                                            type="text"
                                            value={hashtagInput}
                                            onChange={(e) => setHashtagInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                                            placeholder="#design #carpet"
                                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                        />
                                        <button type="button" onClick={addHashtag} className="px-3 md:px-4 py-2 bg-gray-100 rounded-lg text-sm">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {newPost.hashtags.map(tag => (
                                            <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                                #{tag}
                                                <button type="button" onClick={() => removeHashtag(tag)} className="hover:text-red-600">
                                                    <FaTimes size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" disabled={uploading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition text-sm md:text-base">
                                        {uploading ? <FaSpinner className="animate-spin inline mr-2" /> : <FaPaperPlane className="inline mr-2" />}
                                        Post
                                    </button>
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg text-sm md:text-base">Cancel</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Back to Top Button - متجاوب */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        onClick={scrollToTop}
                        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 md:p-4 rounded-full shadow-lg hover:shadow-xl transition z-40"
                    >
                        <FaArrowUp className="text-base md:text-xl" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SocialFeed;