import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  FaHeart, FaRegHeart, FaComment, FaShare, FaTrash, FaEdit,
  FaImage, FaVideo, FaHashtag, FaGlobe, FaLock, FaUsers,
  FaClock, FaCalendarAlt, FaPlay, FaPause, FaVolumeUp,
  FaVolumeMute, FaExpand, FaThumbsUp, FaSmile, FaPaperPlane,
  FaSpinner, FaPlus, FaCamera, FaTimes, FaChevronLeft, FaChevronRight,
  FaEye, FaEyeSlash, FaUserFriends,FaChevronDown
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import VideoPlayer from '../components/VideoPlayer';
import ImageModal from '../components/ImageModal';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';




// Component لعرض التعليقات
const CommentsSection = ({ postId, onCommentAdded, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/posts/${postId}`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    if (!currentUser) {
      toast.error('Please login to comment');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/comment`, {
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

  if (loading && comments.length === 0) {
    return <div className="text-center py-4 text-gray-400 text-sm">Loading comments...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
          {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
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
            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
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
        <div className="space-y-3 max-h-96 overflow-y-auto">
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
                <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
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

// Post Component
const UserPost = ({ post, currentUser, onDelete, onVisibilityChange }) => {
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [liked, setLiked] = useState(post.liked || false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const handleVisibilityChange = async (newVisibility) => {
    try {
      const response = await axios.put(`${API_URL}/posts/${post._id}/visibility`, {
        visibility: newVisibility
      });
      setLocalPost({ ...localPost, visibility: response.data.visibility });
      toast.success(`Post visibility updated to ${newVisibility}`);
      if (onVisibilityChange) onVisibilityChange(post._id, newVisibility);
    } catch (error) {
      toast.error('Failed to update visibility');
    }
    setShowVisibilityMenu(false);
  };

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'public': return <FaGlobe className="text-green-500" title="Public" />;
      case 'followers': return <FaUserFriends className="text-blue-500" title="Followers only" />;
      case 'private': return <FaLock className="text-red-500" title="Only me" />;
      default: return <FaGlobe className="text-green-500" />;
    }
  };

  const getVisibilityText = (visibility) => {
    switch (visibility) {
      case 'public': return 'Public';
      case 'followers': return 'Followers';
      case 'private': return 'Only me';
      default: return 'Public';
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

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 mb-6 overflow-hidden">
        {/* Post Header */}
        <div className="p-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Link to={post.userId?.storeId?.slug ? `/shop/${post.userId.storeId.slug}` : `/shop`}>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md overflow-hidden">
                {post.userId?.storeId?.logo ? (
                  <img src={post.userId.storeId.logo} alt={post.userId?.username} className="w-full h-full object-cover" />
                ) : (
                  post.userId?.username?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
            </Link>
            <div>
              <Link to={post.userId?.storeId?.slug ? `/shop/${post.userId.storeId.slug}` : `/shop`} className="font-semibold hover:text-blue-600 transition">
                {post.userId?.storeId?.name || post.userId?.username || 'Anonymous'}
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <span>{moment(post.createdAt).fromNow()}</span>
                {post.isPinned && <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs">📌 Pinned</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Visibility Button - فقط لصاحب المنشور */}
            {post.userId?._id === currentUser?.id && (
              <div className="relative">
                <button
                  onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                  className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1 text-sm"
                  title={`Visibility: ${getVisibilityText(localPost.visibility)}`}
                >
                  {getVisibilityIcon(localPost.visibility)}
                  <FaChevronDown size={10} />
                </button>
                {showVisibilityMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg p-2 z-20 min-w-[160px]">
                    <button
                      onClick={() => handleVisibilityChange('public')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
                    >
                      <FaGlobe className="text-green-500" /> Public (Everyone)
                    </button>
                    <button
                      onClick={() => handleVisibilityChange('followers')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
                    >
                      <FaUserFriends className="text-blue-500" /> Followers only
                    </button>
                    <button
                      onClick={() => handleVisibilityChange('private')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
                    >
                      <FaLock className="text-red-500" /> Only me
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Delete Button */}
            {post.userId?._id === currentUser?.id && (
              <button onClick={() => onDelete?.(post._id)} className="text-gray-400 hover:text-red-500 transition">
                <FaTrash size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{post.content}</p>
          {post.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.hashtags.map(tag => (
                <span key={tag} className="text-blue-500 text-sm hover:text-blue-700 cursor-pointer">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Media Gallery */}
        {mediaItems.length > 0 && (
          <div className="relative bg-gray-100">
            {mediaItems[currentImageIndex]?.type === 'video' ? (
              <VideoPlayer
                videoUrl={mediaItems[currentImageIndex].url}
                poster={mediaItems[currentImageIndex].thumbnail || mediaItems[currentImageIndex].url}
              />
            ) : (
              <div className="relative">
                <img
                  src={mediaItems[currentImageIndex].url}
                  alt={`Post ${currentImageIndex + 1}`}
                  className="w-full max-h-[500px] object-contain cursor-pointer"
                  onClick={() => setSelectedImage(mediaItems[currentImageIndex].url)}
                />
                {mediaItems.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                    >
                      <FaChevronRight />
                    </button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {currentImageIndex + 1} / {mediaItems.length}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats Bar */}
        <div className="px-4 pt-3 pb-1 flex gap-4 text-sm text-gray-500 border-b">
          <span className="flex items-center gap-1"><FaHeart className="text-red-400" /> {localPost.likesCount || 0} likes</span>
          <span className="flex items-center gap-1"><FaComment /> {localPost.commentsCount || 0} comments</span>
          <span className="flex items-center gap-1"><FaShare /> {localPost.sharesCount || 0} shares</span>
        </div>

        {/* Actions */}
        <div className="px-4 py-2 flex justify-around">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 py-2 px-6 rounded-lg transition ${liked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {liked ? <FaHeart className="text-lg" /> : <FaRegHeart className="text-lg" />}
            <span className="font-medium">Like</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 py-2 px-6 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            <FaComment className="text-lg" />
            <span className="font-medium">Comment</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 py-2 px-6 rounded-lg text-gray-500 hover:bg-gray-100 transition"
            >
              <FaShare className="text-lg" />
              <span className="font-medium">Share</span>
            </button>
            {showShareMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg p-2 z-20 min-w-[160px]">
                <button onClick={() => handleShare('facebook')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2">📘 Facebook</button>
                <button onClick={() => handleShare('twitter')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2">🐦 Twitter</button>
                <button onClick={() => handleShare('whatsapp')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2">💚 WhatsApp</button>
                <button onClick={() => handleShare('copy')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2">🔗 Copy Link</button>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-4 pb-4 pt-3 border-t bg-gray-50">
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
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </>
  );
};

// Main SocialFeed Component
const SocialFeed = ({ user }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  useEffect(() => {
    if (user) {
      fetchMyPosts();
      fetchStats();
    }
  }, [user]);

  const fetchMyPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/posts/user/${user.id}`);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to fetch my posts:', error);
      toast.error('Failed to load your posts');
    } finally {
      setLoading(false);
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

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`${API_URL}/posts/${postId}`);
        setPosts(posts.filter(post => post._id !== postId));
        toast.success('Post deleted');
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  const handleVisibilityChange = (postId, newVisibility) => {
    setPosts(posts.map(post => 
      post._id === postId ? { ...post, visibility: newVisibility } : post
    ));
  };

  const uploadMedia = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();

    for (let file of files) {
      formData.append('media', file);
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
      toast.success(`✅ ${response.data.files.length} file(s) uploaded successfully!`);
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

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-md">
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">My Posts 👋</h2>
            <p className="text-white/80 mt-1">Manage and view all your posts</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{posts.length}</div>
              <div className="text-xs text-white/80">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalLikes || 0}</div>
              <div className="text-xs text-white/80">Likes Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalComments || 0}</div>
              <div className="text-xs text-white/80">Comments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Card */}
      <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold overflow-hidden">
            {user?.storeId?.logo ? (
              <img src={user.storeId.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.username?.charAt(0).toUpperCase()
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 text-left px-5 py-3 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"
          >
            What's on your mind, {user.username}?
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition"
          >
            <FaImage className="text-green-500 text-xl" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition"
          >
            <FaVideo className="text-red-500 text-xl" />
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md">
          <div className="text-7xl mb-4">📝</div>
          <p className="text-gray-500 text-lg">You haven't created any posts yet</p>
          <p className="text-gray-400 text-sm mt-2">Share your thoughts, products, or updates with your followers!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition"
          >
            Create Your First Post
          </button>
        </div>
      ) : (
        <div>
          {posts.map(post => (
            <UserPost
              key={post._id}
              post={post}
              currentUser={user}
              onDelete={handleDeletePost}
              onVisibilityChange={handleVisibilityChange}
            />
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Create Post</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-4 space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white overflow-hidden">
                  {user?.storeId?.logo ? (
                    <img src={user.storeId.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <p className="font-semibold">{user?.storeId?.name || user?.username || 'Guest'}</p>
                  <select
                    value={newPost.visibility}
                    onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                    className="text-xs border rounded-lg px-2 py-1"
                  >
                    <option value="public">🌍 Public</option>
                    <option value="followers">👥 Followers</option>
                    <option value="private">🔒 Only me</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="5"
              />

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Add Media</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <FaImage className="inline mr-1" /> Upload
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => uploadMedia(Array.from(e.target.files))}
                  />
                </div>
                {uploading && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>📤 Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {newPost.media.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {newPost.media.map((media, idx) => (
                      <div key={idx} className="relative w-16 h-16">
                        <img src={media.url} alt="Preview" className="w-full h-full object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => setNewPost({ ...newPost, media: newPost.media.filter((_, i) => i !== idx) })}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium mb-2">Hashtags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                    placeholder="#design #carpet"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button type="button" onClick={addHashtag} className="px-4 py-2 bg-gray-100 rounded-lg">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPost.hashtags.map(tag => (
                    <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      #{tag}
                      <button type="button" onClick={() => removeHashtag(tag)} className="hover:text-red-600">
                        <FaTimes size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={uploading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition">
                  {uploading ? <FaSpinner className="animate-spin inline mr-2" /> : <FaPaperPlane className="inline mr-2" />}
                  Post
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;