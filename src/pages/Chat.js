
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import {
    FaComments, FaUser, FaSearch, FaPaperPlane, FaImage,
    FaSmile, FaPaperclip, FaTrash, FaArchive, FaPhone,
    FaVideo, FaInfoCircle, FaArrowLeft, FaCheck, FaCheckDouble,
    FaRegClock, FaCircle, FaTimes, FaSpinner, FaUsers,
    FaUserPlus, FaEllipsisV, FaHeart, FaRegHeart, FaThumbsUp,
    FaRegThumbsUp, FaRegLaugh, FaRegFrown, FaRegAngry, FaRegSurprise,
    FaReply, FaCopy, FaQuoteLeft, FaArrowDown, FaArrowUp,
    FaLongArrowAltDown, FaLongArrowAltUp, FaVolumeUp, FaVolumeMute,
    FaDownload, FaStar, FaRegStar, FaFlag, FaBan, FaExclamationTriangle,
    FaBars, FaTimes as FaClose, FaCog
} from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

// Reaction options
const REACTIONS = [
    { emoji: '❤️', label: 'Love', icon: <FaHeart className="text-red-500" />, color: 'text-red-500' },
    { emoji: '👍', label: 'Like', icon: <FaThumbsUp className="text-blue-500" />, color: 'text-blue-500' },
    { emoji: '😂', label: 'Laugh', icon: <FaRegLaugh className="text-yellow-500" />, color: 'text-yellow-500' },
    { emoji: '😮', label: 'Wow', icon: <FaRegSurprise className="text-orange-500" />, color: 'text-orange-500' },
    { emoji: '😢', label: 'Sad', icon: <FaRegFrown className="text-blue-400" />, color: 'text-blue-400' },
    { emoji: '😡', label: 'Angry', icon: <FaRegAngry className="text-red-600" />, color: 'text-red-600' }
];

// Message status component
const MessageStatus = ({ status }) => {
    switch (status) {
        case 'sending':
            return <FaRegClock className="text-gray-400 text-xs" />;
        case 'sent':
            return <FaCheck className="text-gray-400 text-xs" />;
        case 'delivered':
            return <FaCheckDouble className="text-gray-400 text-xs" />;
        case 'read':
            return <FaCheckDouble className="text-blue-500 text-xs" />;
        default:
            return null;
    }
};

const Chat = () => {
    const navigate = useNavigate();
    const { conversationId: urlConversationId } = useParams();
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [editMessage, setEditMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [typing, setTyping] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
    const [isMuted, setIsMuted] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [searchInChat, setSearchInChat] = useState('');
    const [searchResultsInChat, setSearchResultsInChat] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    // ✅ إضافة حالة للـ Sidebar على الموبايل
    const [showSidebar, setShowSidebar] = useState(false);

    const [uploadingMedia, setUploadingMedia] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const pollingInterval = useRef(null);
    const typingInterval = useRef(null);
    const searchInputRef = useRef(null);

    const [showProfileDrawer, setShowProfileDrawer] = useState(false);
    const [sharedMedia, setSharedMedia] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [chatSettings, setChatSettings] = useState({
        bubbleColor: '#3b82f6',      // لون فقاعة الرسائل الخاصة
        otherBubbleColor: '#f3f4f6', // لون فقاعة رسائل الطرف الآخر
        backgroundColor: '#f9fafb',   // لون خلفية المحادثة
        fontFamily: 'sans-serif',
        fontSize: '14px'
    });

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');


    // رفع ملف واحد
    const uploadFile = async (file, type = 'image') => {
        const formData = new FormData();
        const endpoint = type === 'video' ? '/upload/video' : '/upload';
        formData.append(type === 'video' ? 'video' : 'image', file);

        try {
            const response = await axios.post(`${API_URL}${endpoint}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Upload progress: ${percent}%`);
                }
            });
            return response.data;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    };

    // رفع صور متعددة
    const uploadMultipleFiles = async (files) => {
        const formData = new FormData();
        for (let file of files) {
            formData.append('media', file);
        }

        try {
            const response = await axios.post(`${API_URL}/upload/multiple`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Upload progress: ${percent}%`);
                }
            });
            return response.data;
        } catch (error) {
            console.error('Multiple upload failed:', error);
            throw error;
        }
    };

    // معالجة اختيار الصور
    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingMedia(true);
        try {
            // رفع الصور أولاً
            const uploadResult = await uploadMultipleFiles(files);

            // إرسال رسالة مع روابط الصور
            for (const file of uploadResult.files) {
                const mediaMessage = {
                    conversationId: currentConversation._id,
                    receiverId: currentConversation.otherUser._id,
                    text: '',
                    type: file.type,
                    mediaUrl: file.url
                };

                await axios.post(`${API_URL}/chat/messages`, mediaMessage);
            }

            toast.success(`${uploadResult.count} file(s) uploaded and sent`);
            await fetchMessages(currentConversation._id, true);
            setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            toast.error('Failed to upload files');
        } finally {
            setUploadingMedia(false);
            e.target.value = '';
        }
    };

    // معالجة اختيار فيديو
    const handleVideoSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Please select a video file');
            return;
        }

        setUploadingMedia(true);
        try {
            const uploadResult = await uploadFile(file, 'video');

            const mediaMessage = {
                conversationId: currentConversation._id,
                receiverId: currentConversation.otherUser._id,
                text: '',
                type: 'video',
                mediaUrl: uploadResult.url
            };

            await axios.post(`${API_URL}/chat/messages`, mediaMessage);

            toast.success('Video uploaded and sent');
            await fetchMessages(currentConversation._id, true);
            setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            toast.error('Failed to upload video');
        } finally {
            setUploadingMedia(false);
            e.target.value = '';
        }
    };

    // جلب المحادثات
    const fetchConversations = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/chat/conversations`);
            if (response.data && response.data.conversations) {
                console.log('📋 Conversations loaded:', response.data.conversations);
                setConversations(response.data.conversations);
            } else {
                setConversations([]);
            }
        } catch (error) {
            console.error('Fetch conversations error:', error);
            setConversations([]);
        }
    }, []);



    // التمرير لأسفل
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, []);

    // التمرير لرسالة معينة
    const scrollToMessage = (messageId) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-yellow-100', 'transition-all', 'duration-500');
            setTimeout(() => {
                element.classList.remove('bg-yellow-100');
            }, 2000);
        }
    };
    // جلب الرسائل
    const fetchMessages = useCallback(async (convId, reset = true) => {
        if (!convId) return;

        try {
            const response = await axios.get(`${API_URL}/chat/messages/${convId}`, {
                params: { page: reset ? 1 : page + 1, limit: 50 }
            });

            if (reset) {
                setMessages(response.data.messages);
                setPage(1);
                setHasMore(response.data.hasMore);
                // ✅ التمرير إلى أسفل بعد تحميل الرسائل
                setTimeout(() => scrollToBottom(), 100);
            } else {
                const prevHeight = messagesContainerRef.current?.scrollHeight;
                setMessages(prev => [...response.data.messages, ...prev]);
                setPage(prev => prev + 1);
                setHasMore(response.data.hasMore);

                setTimeout(() => {
                    if (messagesContainerRef.current) {
                        const newHeight = messagesContainerRef.current.scrollHeight;
                        messagesContainerRef.current.scrollTop = newHeight - prevHeight;
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Fetch messages error:', error);
        }
    }, [page, scrollToBottom]);

    // البحث في المحادثة
    const searchInConversation = useCallback(() => {
        if (!searchInChat.trim()) {
            setSearchResultsInChat([]);
            setCurrentSearchIndex(-1);
            return;
        }

        const results = messages.filter(msg =>
            msg.text?.toLowerCase().includes(searchInChat.toLowerCase())
        );
        setSearchResultsInChat(results);
        setCurrentSearchIndex(results.length > 0 ? 0 : -1);

        if (results.length > 0) {
            scrollToMessage(results[0]._id);
            toast.success(`Found ${results.length} message(s)`);
        } else {
            toast.info('No messages found');
        }
    }, [messages, searchInChat]);

    const goToNextSearchResult = () => {
        if (searchResultsInChat.length === 0) return;
        const nextIndex = (currentSearchIndex + 1) % searchResultsInChat.length;
        setCurrentSearchIndex(nextIndex);
        scrollToMessage(searchResultsInChat[nextIndex]._id);
    };

    const goToPrevSearchResult = () => {
        if (searchResultsInChat.length === 0) return;
        const prevIndex = currentSearchIndex - 1;
        if (prevIndex < 0) {
            setCurrentSearchIndex(searchResultsInChat.length - 1);
            scrollToMessage(searchResultsInChat[searchResultsInChat.length - 1]._id);
        } else {
            setCurrentSearchIndex(prevIndex);
            scrollToMessage(searchResultsInChat[prevIndex]._id);
        }
    };

    // بدء Polling
    const startPolling = useCallback((convId) => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        let lastMessageCount = messages.length;

        pollingInterval.current = setInterval(async () => {
            if (!convId) return;
            try {
                // جلب الرسائل الجديدة
                const response = await axios.get(`${API_URL}/chat/messages/${convId}`, {
                    params: { page: 1, limit: 50 }
                });

                const newMessages = response.data.messages;
                const newMessageCount = newMessages.length;

                if (newMessageCount > lastMessageCount) {
                    setMessages(newMessages);
                    // ✅ تحديث قائمة المحادثات للحصول على آخر رسالة محدثة
                    fetchConversations();
                    setTimeout(() => scrollToBottom(), 100);
                } else {
                    setMessages(newMessages);
                }

                lastMessageCount = newMessageCount;
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000);
    }, [fetchConversations, messages.length, scrollToBottom]);
    // إضافة رد فعل على رسالة
    const addReaction = async (messageId, reaction) => {
        try {
            await axios.post(`${API_URL}/chat/messages/${messageId}/reaction`, { reaction });
            setMessages(prev => prev.map(msg =>
                msg._id === messageId
                    ? { ...msg, reaction: reaction, reactionBy: currentUser.id }
                    : msg
            ));
            setShowReactionPicker(null);
            toast.success(`Reacted with ${reaction}`);
        } catch (error) {
            console.error('Add reaction error:', error);
        }
    };

    // الرد على رسالة
    const replyToMessage = (message) => {
        setReplyTo(message);
        setMessageText('');
        document.getElementById('message-input')?.focus();
        const previewText = message.text?.substring(0, 50);
        toast.success(`Replying to: ${previewText}${message.text?.length > 50 ? '...' : ''}`);
    };

    // نسخ نص الرسالة
    const copyMessage = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Message copied');
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
    };

    // حذف رسالة
    const deleteMessage = async (messageId) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                await axios.delete(`${API_URL}/chat/messages/${messageId}`);
                setMessages(prev => prev.filter(msg => msg._id !== messageId));
                toast.success('Message deleted');
                setContextMenu({ visible: false, x: 0, y: 0, message: null });
            } catch (error) {
                toast.error('Failed to delete message');
            }
        }
    };


    // جلب الوسائط المشتركة بين المستخدمين
    const fetchSharedMedia = async () => {
        if (!currentConversation) return;
        setLoadingMedia(true);
        try {
            const response = await axios.get(`${API_URL}/chat/conversations/${currentConversation._id}/media`);
            setSharedMedia(response.data.media);
        } catch (error) {
            console.error('Failed to fetch shared media:', error);
        } finally {
            setLoadingMedia(false);
        }
    };

    // تحديث إعدادات المحادثة
    const updateChatSettings = async (settings) => {
        try {
            await axios.put(`${API_URL}/chat/conversations/${currentConversation._id}/settings`, settings);
            const newSettings = { ...chatSettings, ...settings };
            setChatSettings(newSettings);
            // تطبيق الإعدادات مباشرة على DOM
            if (messagesContainerRef.current) {
                messagesContainerRef.current.style.backgroundColor = newSettings.backgroundColor;
                messagesContainerRef.current.style.fontFamily = newSettings.fontFamily;
            }
            // تحديث الرسائل الموجودة
            const messageElements = document.querySelectorAll('.message-text');
            messageElements.forEach(el => {
                el.style.fontSize = newSettings.fontSize;
                el.style.fontFamily = newSettings.fontFamily;
            });
            toast.success('Chat settings updated');
        } catch (error) {
            toast.error('Failed to update settings');
        }
    };

    // تطبيق الإعدادات على واجهة المستخدم
    const applyChatSettings = (settings) => {
        // تحديث خلفية حاوية الرسائل
        if (messagesContainerRef.current) {
            messagesContainerRef.current.style.backgroundColor = settings.backgroundColor;
            messagesContainerRef.current.style.fontFamily = settings.fontFamily;
        }

        // تحديث إعدادات الخط للنص في الرسائل الموجودة
        const messageElements = document.querySelectorAll('.message-text');
        messageElements.forEach(el => {
            el.style.fontSize = settings.fontSize;
            el.style.fontFamily = settings.fontFamily;
        });

        // تحديث لون فقاعات الرسائل (للمستقبل)
        document.documentElement.style.setProperty('--message-bubble-color', settings.bubbleColor);
        document.documentElement.style.setProperty('--other-bubble-color', settings.otherBubbleColor);
    };

    // جلب إعدادات المحادثة المحفوظة
    const fetchChatSettings = async () => {
        if (!currentConversation) return;
        try {
            const response = await axios.get(`${API_URL}/chat/conversations/${currentConversation._id}/settings`);
            if (response.data.settings) {
                setChatSettings(response.data.settings);
                // تأخير بسيط لضمان تحميل عناصر DOM
                setTimeout(() => applyChatSettings(response.data.settings), 100);
            }
        } catch (error) {
            console.error('Failed to fetch chat settings:', error);
        }
    };

    // تحرير رسالة
    const editMessageHandler = async (messageId, newText) => {
        try {
            await axios.put(`${API_URL}/chat/messages/${messageId}`, { text: newText });
            setMessages(prev => prev.map(msg =>
                msg._id === messageId ? { ...msg, text: newText, isEdited: true } : msg
            ));
            setEditMessage(null);
            toast.success('Message edited');
        } catch (error) {
            toast.error('Failed to edit message');
        }
    };

    // الإبلاغ عن رسالة
    const reportMessage = async (messageId) => {
        try {
            await axios.post(`${API_URL}/chat/messages/${messageId}/report`);
            toast.success('Message reported to admin');
            setContextMenu({ visible: false, x: 0, y: 0, message: null });
        } catch (error) {
            toast.error('Failed to report message');
        }
    };

    // تثبيت المحادثة
    const togglePinConversation = async () => {
        try {
            await axios.put(`${API_URL}/chat/conversations/${currentConversation._id}/pin`, {
                isPinned: !isPinned
            });
            setIsPinned(!isPinned);
            toast.success(isPinned ? 'Conversation unpinned' : 'Conversation pinned');
            fetchConversations();
        } catch (error) {
            toast.error('Failed to pin conversation');
        }
    };

    // كتم المحادثة
    const toggleMuteConversation = async () => {
        try {
            await axios.put(`${API_URL}/chat/conversations/${currentConversation._id}/mute`, {
                isMuted: !isMuted
            });
            setIsMuted(!isMuted);
            toast.success(isMuted ? 'Conversation unmuted' : 'Conversation muted');
        } catch (error) {
            toast.error('Failed to mute conversation');
        }
    };

    // أرشفة المحادثة
    const archiveConversation = async () => {
        try {
            await axios.put(`${API_URL}/chat/conversations/${currentConversation._id}/archive`);
            toast.success('Conversation archived');
            navigate('/chat');
            fetchConversations();
        } catch (error) {
            toast.error('Failed to archive conversation');
        }
    };

    // حذف المحادثة
    const deleteConversation = async () => {
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            try {
                await axios.delete(`${API_URL}/chat/conversations/${currentConversation._id}`);
                toast.success('Conversation deleted');
                navigate('/chat');
                fetchConversations();
            } catch (error) {
                toast.error('Failed to delete conversation');
            }
        }
    };


    // التمرير إلى الرسالة التي تم الرد عليها
    const scrollToRepliedMessage = (replyToId) => {
        const element = document.getElementById(`message-${replyToId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-green-500', 'bg-green-50', 'transition-all', 'duration-500');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-green-500', 'bg-green-50');
            }, 3000);
            toast.success('Scrolled to original message');
        } else {
            toast.info('Original message not found in current view');
        }
    };

    // التحقق من التمرير
    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            setShowScrollButton(!isNearBottom);

            if (container.scrollTop === 0 && hasMore && !loadingMore) {
                setLoadingMore(true);
                fetchMessages(currentConversation?._id, false).finally(() => {
                    setLoadingMore(false);
                });
            }
        }
    };

    // Context menu
    const handleContextMenu = (e, message) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            message
        });
    };

    useEffect(() => {
        const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // إرسال رسالة مع تحسين سرعة العرض
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        if (!currentConversation) return;

        const tempId = Date.now();
        const tempMessage = {
            _id: tempId,
            text: messageText,
            senderId: { _id: currentUser.id, username: currentUser.username },
            receiverId: currentConversation.otherUser._id,
            createdAt: new Date(),
            status: 'sending'
        };

        setMessages(prev => [...prev, tempMessage]);
        setTimeout(() => scrollToBottom(), 50);

        // ✅ تحديث آخر رسالة في قائمة المحادثات محلياً
        setConversations(prev => prev.map(conv =>
            conv._id === currentConversation._id
                ? {
                    ...conv,
                    lastMessage: `You: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
                    lastMessageTime: new Date(),
                    unreadCount: 0
                }
                : conv
        ));

        setSending(true);
        try {
            const response = await axios.post(`${API_URL}/chat/messages`, {
                conversationId: currentConversation._id,
                receiverId: currentConversation.otherUser._id,
                text: messageText,
                replyTo: replyTo?._id || null
            });

            setMessages(prev => prev.map(msg =>
                msg._id === tempId ? response.data.message : msg
            ));
            setMessageText('');
            setReplyTo(null);

            // ✅ جلب المحادثات مرة أخرى للتأكد من التحديث
            fetchConversations();
            setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // تحديث حالة الكتابة
    const handleTyping = async () => {
        if (!currentConversation) return;

        if (!typing) {
            setTyping(true);
            await axios.post(`${API_URL}/chat/typing`, {
                conversationId: currentConversation._id,
                isTyping: true
            });
        }

        if (typingTimeout) clearTimeout(typingTimeout);
        const timeout = setTimeout(async () => {
            setTyping(false);
            await axios.post(`${API_URL}/chat/typing`, {
                conversationId: currentConversation._id,
                isTyping: false
            });
        }, 1000);
        setTypingTimeout(timeout);
    };

    // البحث عن مستخدمين
    const searchUsers = async () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/chat/search-users`, {
                params: { q: searchTerm }
            });

            let users = [];
            if (response.data && response.data.users && Array.isArray(response.data.users)) {
                users = response.data.users;
            } else if (Array.isArray(response.data)) {
                users = response.data;
            }

            setSearchResults(users);

            if (users.length === 0 && searchTerm.trim()) {
                toast.info(`No users found matching "${searchTerm}"`);
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search users');
            setSearchResults([]);
        }
    };

    // بدء محادثة جديدة
    const startNewChat = async (user) => {
        setShowSearch(false);
        setSearchTerm('');
        setSearchResults([]);
        setShowSidebar(false); // ✅ إغلاق الـ Sidebar على الموبايل بعد اختيار المستخدم
        try {
            const response = await axios.post(`${API_URL}/chat/conversation`, {
                otherUserId: user._id
            });
            const conv = response.data.conversation;
            navigate(`/chat/${conv._id}`);
        } catch (error) {
            console.error('Failed to start chat:', error);
            toast.error('Failed to start chat');
        }
    };

    // تحميل المحادثة
    const loadConversation = useCallback(async (convId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/chat/conversation/${convId}`);
            const conversation = response.data.conversation;

            setCurrentConversation(conversation);
            await fetchMessages(convId, true);
            startPolling(convId);
            fetchConversations();

            // ✅ أضف هذا السطر لجلب إعدادات المحادثة
            await fetchChatSettings();

            const settings = conversation.settings || {};
            setIsPinned(settings.isPinned || false);
            setIsMuted(settings.isMuted || false);

            if (window.innerWidth < 768) {
                setShowSidebar(false);
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
            toast.error('Failed to load conversation');
        } finally {
            setLoading(false);
        }
    }, [fetchMessages, startPolling, fetchConversations, fetchChatSettings]);

    // تصدير المحادثة
    const exportConversation = async () => {
        try {
            const response = await axios.get(`${API_URL}/chat/conversations/${currentConversation._id}/export`);
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-${currentConversation.otherUser?.username}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Conversation exported');
        } catch (error) {
            toast.error('Failed to export conversation');
        }
    };

    useEffect(() => {
        fetchConversations();

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            if (typingInterval.current) clearInterval(typingInterval.current);
        };
    }, [fetchConversations]);

    useEffect(() => {
        if (!urlConversationId || urlConversationId === 'new') {
            setLoading(false);
            return;
        }

        if (urlConversationId) {
            loadConversation(urlConversationId);
        }
    }, [urlConversationId, loadConversation]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading && !currentConversation && (!urlConversationId || urlConversationId === 'new')) {
                setLoading(false);
            }
        }, 2000);

        return () => clearTimeout(timeout);
    }, [loading, currentConversation, urlConversationId]);

    useEffect(() => {
        searchInConversation();
    }, [searchInChat, messages]);


    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, scrollToBottom]);



    // Ping interval لتحديث آخر ظهور
    useEffect(() => {
        if (!currentUser?.id) return;

        const pingInterval = setInterval(async () => {
            try {
                await axios.post(`${API_URL}/user/ping`);
            } catch (error) {
                console.error('Ping error:', error);
            }
        }, 30000); // كل 30 ثانية

        return () => clearInterval(pingInterval);
    }, [currentUser?.id]);

    // جلب المحادثات وتحديث الحالة معاً
    useEffect(() => {
        if (!currentUser?.id) return;

        const updateData = async () => {
            // تحديث الحالة (Ping)
            try {
                await axios.post(`${API_URL}/user/ping`);
            } catch (error) {
                console.error('Ping error:', error);
            }
            // جلب المحادثات
            fetchConversations();
        };

        updateData();
        const interval = setInterval(updateData, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, [currentUser?.id, fetchConversations]);


    // تحديث الحالة عند إغلاق الصفحة أو تسجيل الخروج
    useEffect(() => {
        const handleBeforeUnload = async () => {
            try {
                await axios.post(`${API_URL}/user/offline`);
            } catch (error) {
                console.error('Offline error:', error);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);


    // تطبيق إعدادات المحادثة عند تغييرها
    // useEffect(() => {
    //     if (messagesContainerRef.current) {
    //         messagesContainerRef.current.style.backgroundColor = chatSettings.backgroundColor;
    //         messagesContainerRef.current.style.fontFamily = chatSettings.fontFamily;
    //     }
    // }, [chatSettings.backgroundColor, chatSettings.fontFamily]);


    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchTerm.trim()) {
                searchUsers();
            } else {
                setSearchResults([]);
                setShowSearch(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    if (loading && !currentConversation && urlConversationId && urlConversationId !== 'new') {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }



    // Profile Drawer Component
    const ProfileDrawer = ({ user, onClose, onViewStore, onBlock, onReport, sharedMedia, loadingMedia, chatSettings, updateChatSettings }) => {
        const [activeTab, setActiveTab] = useState('info');
        const [localSettings, setLocalSettings] = useState(chatSettings);
        const [localSharedMedia, setLocalSharedMedia] = useState(sharedMedia);
        const [localLoadingMedia, setLocalLoadingMedia] = useState(loadingMedia);

        // تحديث الوسائط عند تغيير الـ tab
        useEffect(() => {
            if (activeTab === 'media' && localSharedMedia.length === 0 && !localLoadingMedia) {
                fetchSharedMediaInternal();
            }
        }, [activeTab]);

        const fetchSharedMediaInternal = async () => {
            if (!currentConversation?._id) return;
            setLocalLoadingMedia(true);
            try {
                const response = await axios.get(`${API_URL}/chat/conversations/${currentConversation._id}/media`);
                setLocalSharedMedia(response.data.media);
            } catch (error) {
                console.error('Failed to fetch media:', error);
                toast.error('Failed to load media');
            } finally {
                setLocalLoadingMedia(false);
            }
        };

        const handleSettingChange = (key, value) => {
            setLocalSettings({ ...localSettings, [key]: value });
            updateChatSettings({ [key]: value });
        };

        return (
            <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Profile Info</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Profile Info */}
                <div className="p-6 text-center border-b">
                    <Link to={user?.storeId?.slug ? `/shop/${user.storeId.slug}` : '/shop'} onClick={onClose}>
                        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                            {user?.storeId?.logo ? (
                                <img src={user.storeId.logo} alt={user?.username} className="w-full h-full object-cover" />
                            ) : (
                                user?.username?.charAt(0).toUpperCase()
                            )}
                        </div>
                    </Link>
                    <h3 className="text-xl font-bold mt-3">{user?.username}</h3>
                    {user?.storeId?.name && (
                        <p className="text-gray-500 text-sm">{user.storeId.name}</p>
                    )}
                    <div className="flex gap-2 justify-center mt-3">
                        <button onClick={onViewStore} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition">
                            View Store
                        </button>
                        <button onClick={onBlock} className="px-3 py-1 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition">
                            Block
                        </button>
                        <button onClick={onReport} className="px-3 py-1 bg-gray-600 text-white text-sm rounded-full hover:bg-gray-700 transition">
                            Report
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        <FaUser className="inline mr-1" /> Info
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'media' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        <FaImage className="inline mr-1" /> Media
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        <FaCog className="inline mr-1" /> Settings
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {activeTab === 'info' && (
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Username</span>
                                <span className="font-medium">{user?.username}</span>
                            </div>
                            {user?.email && (
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-500">Email</span>
                                    <span className="font-medium">{user.email}</span>
                                </div>
                            )}
                            {user?.storeId?.name && (
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-500">Store</span>
                                    <span className="font-medium text-blue-600">{user.storeId.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Joined</span>
                                <span className="font-medium">{moment(user?.createdAt).format('MMMM YYYY')}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-medium ${user?.status?.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                    {user?.status?.isOnline ? 'Online' : user?.status?.text || 'Offline'}
                                </span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div>
                            {localLoadingMedia ? (
                                <div className="flex justify-center py-8">
                                    <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                                </div>
                            ) : localSharedMedia.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <FaImage size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>No shared media yet</p>
                                    <p className="text-xs mt-1">Share images or videos to see them here</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {localSharedMedia.map((media, idx) => (
                                        <div
                                            key={idx}
                                            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition"
                                            onClick={() => window.open(media.url, '_blank')}
                                        >
                                            {media.type === 'image' ? (
                                                <img src={media.url} alt="Shared" className="w-full h-full object-cover" />
                                            ) : media.type === 'video' ? (
                                                <video src={media.url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FaFile className="text-gray-400 text-2xl" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">My Message Color</label>
                                <input type="color" value={localSettings.bubbleColor} onChange={(e) => handleSettingChange('bubbleColor', e.target.value)} className="w-full h-10 rounded border cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Their Message Color</label>
                                <input type="color" value={localSettings.otherBubbleColor} onChange={(e) => handleSettingChange('otherBubbleColor', e.target.value)} className="w-full h-10 rounded border cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Background Color</label>
                                <input type="color" value={localSettings.backgroundColor} onChange={(e) => handleSettingChange('backgroundColor', e.target.value)} className="w-full h-10 rounded border cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Font Size</label>
                                <select value={localSettings.fontSize} onChange={(e) => handleSettingChange('fontSize', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                                    <option value="12px">Small</option>
                                    <option value="14px">Medium</option>
                                    <option value="16px">Large</option>
                                    <option value="18px">Extra Large</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Font Family</label>
                                <select value={localSettings.fontFamily} onChange={(e) => handleSettingChange('fontFamily', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                                    <option value="sans-serif">Sans Serif</option>
                                    <option value="serif">Serif</option>
                                    <option value="monospace">Monospace</option>
                                    <option value="cursive">Cursive</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    return (
        <div className="flex h-[calc(100vh-72px)] bg-gray-100 overflow-hidden relative">
            {/* ✅ Sidebar - تظهر على الموبايل كـ Overlay */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0 md:shadow-none md:z-0
                ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Header مع زر إغلاق للموبايل */}
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FaComments className="text-blue-600" /> Messages
                                <span className="text-xs text-gray-400 font-normal">
                                    ({conversations.length})
                                </span>
                            </h2>
                        </div>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="md:hidden p-2 hover:bg-gray-200 rounded-full transition"
                        >
                            <FaClose className="text-gray-600" />
                        </button>
                    </div>

                    <div className="p-4 border-b">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (!e.target.value.trim()) {
                                            setSearchResults([]);
                                        }
                                    }}
                                    className="w-full pl-10 pr-4 py-2 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 border"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setShowSearch(!showSearch);
                                    setSearchTerm('');
                                    setSearchResults([]);
                                }}
                                className="p-2 hover:bg-gray-200 rounded-full transition"
                                title="New Chat"
                            >
                                <FaUserPlus size={18} className="text-blue-600" />
                            </button>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="mt-3 bg-white rounded-xl shadow-lg border max-h-80 overflow-y-auto">
                                <div className="text-xs text-gray-400 px-3 py-2 border-b bg-gray-50 sticky top-0">
                                    Found {searchResults.length} user(s)
                                </div>
                                {searchResults.map(user => (
                                    <button
                                        key={user._id}
                                        onClick={() => startNewChat(user)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition border-b last:border-0"
                                    >
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                                            {user.storeId?.logo ? (
                                                <img src={user.storeId.logo} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                user.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium">{user.username}</p>
                                            <p className="text-xs text-gray-400">{user.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchTerm && searchResults.length === 0 && (
                            <div className="mt-3 bg-white rounded-xl shadow-lg border">
                                <div className="text-center py-6 text-gray-400">
                                    <FaUser size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No users found matching "{searchTerm}"</p>
                                    <p className="text-xs mt-1">Try a different search term</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <FaComments size={48} className="mx-auto mb-3" />
                                <p>No messages yet</p>
                                <p className="text-sm">Search for users to start chatting</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const hasUnread = conv.unreadCount > 0;
                                return (
                                    <Link
                                        key={conv._id}
                                        to={`/chat/${conv._id}`}
                                        onClick={(e) => {
                                            // ✅ إذا كان Ctrl/Cmd+Click، اترك السلوك الافتراضي (فتح في تاب جديد)
                                            if (e.ctrlKey || e.metaKey) {
                                                return;
                                            }
                                            // ✅ للضغط العادي، منع التنقل التلقائي والتعامل معه يدوياً
                                            e.preventDefault();
                                            navigate(`/chat/${conv._id}`);
                                            loadConversation(conv._id);
                                        }}
                                        className={`block w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b ${currentConversation?._id === conv._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                            } ${conv.isPinned ? 'bg-yellow-50/30' : ''}`}
                                    >
                                        <Link to={conv.otherUser?.storeId?.slug ? `/shop/${conv.otherUser.storeId.slug}` : '/shop'} onClick={(e) => e.stopPropagation()}>
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                                                    {conv.otherUser?.storeId?.logo ? (
                                                        <img src={conv.otherUser.storeId.logo} alt={conv.otherUser?.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        conv.otherUser?.username?.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                {hasUnread && (
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold">
                                                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                    </span>
                                                )}
                                                {conv.isTyping && (
                                                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="flex-1 text-left">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className={`font-semibold flex items-center gap-1 ${hasUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {conv.otherUser?.username}
                                                        {conv.isPinned && <FaStar size={10} className="text-yellow-500" />}
                                                    </p>
                                                    {/* ✅ عرض حالة المستخدم (نشط/آخر ظهور) */}
                                                    <p className={`text-xs ${conv.otherUser?.status?.color || 'text-gray-400'}`}>
                                                        {conv.otherUser?.status?.isOnline ? (
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                                Online
                                                            </span>
                                                        ) : (
                                                            conv.otherUser?.status?.text || 'Offline'
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {moment(conv.lastMessageTime).calendar(null, {
                                                        sameDay: 'HH:mm',
                                                        lastDay: 'Yesterday',
                                                        lastWeek: 'dddd',
                                                        sameElse: 'DD/MM/YY'
                                                    })}
                                                </span>
                                            </div>
                                            <div className={`text-sm truncate flex items-center gap-1 ${hasUnread ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                                {conv.isTyping ? (
                                                    <span className="text-blue-500 animate-pulse">Typing...</span>
                                                ) : (
                                                    <span className="truncate">
                                                        {conv.lastMessage || 'No messages yet'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
                {currentConversation ? (
                    <>
                        {/* Chat Header - مع زر فتح الـ Sidebar على الموبايل */}
                        <div className="p-4 bg-white border-b flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowSidebar(true)}
                                    className="md:hidden p-2 hover:bg-gray-100 rounded-full transition"
                                >
                                    <FaBars className="text-gray-600" />
                                </button>
                                <button onClick={() => navigate('/chat')} className="lg:hidden p-2 hover:bg-gray-100 rounded-full">
                                    <FaArrowLeft className="text-gray-600" />
                                </button>

                                {/* صورة المستخدم */}
                                {/* صورة المستخدم - تعديل onClick لفتح الـ Drawer بدلاً من الرابط المباشر */}
                                <div onClick={() => setShowProfileDrawer(true)} className="cursor-pointer">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white overflow-hidden">
                                            {currentConversation.otherUser?.storeId?.logo ? (
                                                <img src={currentConversation.otherUser.storeId.logo} alt={currentConversation.otherUser?.username} className="w-full h-full object-cover" />
                                            ) : (
                                                currentConversation.otherUser?.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        {currentConversation.otherUser?.status?.isOnline && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">
                                            {currentConversation.otherUser?.username}
                                        </h3>
                                        {currentConversation.otherUser?.storeId && (
                                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Seller</span>
                                        )}
                                    </div>

                                    {/* ✅ حالة المستخدم (Online / آخر ظهور) */}
                                    {currentConversation.otherUser?.status?.isOnline ? (
                                        <p className="text-xs text-green-500 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                            Online
                                        </p>
                                    ) : currentConversation.otherUser?.status?.lastSeen ? (
                                        <div className="relative group">
                                            <p className="text-xs text-gray-400 cursor-help">
                                                Last seen {moment(currentConversation.otherUser.status.lastSeen).fromNow()}
                                            </p>
                                            {/* ✅ Tooltip عند hover لعرض الوقت بالتفصيل */}
                                            <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                                                {moment(currentConversation.otherUser.status.lastSeen).format('MMMM Do YYYY, h:mm:ss a')}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400">Offline</p>
                                    )}

                                    {/* ✅ حالة الكتابة */}
                                    {otherUserTyping && (
                                        <p className="text-xs text-blue-500 animate-pulse mt-0.5">Typing...</p>
                                    )}
                                </div>
                            </div>

                            {/* أزرار الإجراءات */}
                            <div className="flex gap-2">
                                <button
                                    onClick={togglePinConversation}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                    title={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                                >
                                    {isPinned ? <FaStar className="text-yellow-500" /> : <FaRegStar className="text-gray-500" />}
                                </button>
                                <button
                                    onClick={toggleMuteConversation}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                    title={isMuted ? 'Unmute conversation' : 'Mute conversation'}
                                >
                                    {isMuted ? <FaVolumeMute className="text-gray-500" /> : <FaVolumeUp className="text-gray-500" />}
                                </button>

                                {/* قائمة الإجراءات الإضافية */}
                                <div className="relative group">
                                    <button className="p-2 hover:bg-gray-100 rounded-full transition">
                                        <FaEllipsisV className="text-gray-600" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20 min-w-[180px] hidden group-hover:block border">
                                        <button onClick={exportConversation} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3">
                                            <FaDownload size={14} /> Export Chat
                                        </button>
                                        <button onClick={archiveConversation} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3">
                                            <FaArchive size={14} /> Archive
                                        </button>
                                        <hr className="my-1" />
                                        <button onClick={deleteConversation} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                                            <FaTrash size={14} /> Delete Conversation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search in Chat Bar */}
                        <div className="px-4 py-2 bg-white border-b flex items-center gap-2">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search in this conversation..."
                                    value={searchInChat}
                                    onChange={(e) => setSearchInChat(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {searchResultsInChat.length > 0 && (
                                <div className="flex gap-1">
                                    <span className="text-xs text-gray-500">
                                        {currentSearchIndex + 1}/{searchResultsInChat.length}
                                    </span>
                                    <button onClick={goToPrevSearchResult} className="p-1 hover:bg-gray-100 rounded">
                                        <FaArrowUp size={12} />
                                    </button>
                                    <button onClick={goToNextSearchResult} className="p-1 hover:bg-gray-100 rounded">
                                        <FaArrowDown size={12} />
                                    </button>
                                    <button onClick={() => setSearchInChat('')} className="p-1 hover:bg-gray-100 rounded">
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Reply Preview */}
                        {replyTo && (
                            <div className="bg-blue-50 px-4 py-2 border-b flex justify-between items-center">
                                <div className="flex items-center gap-2 text-sm flex-1">
                                    <FaReply className="text-blue-400" />
                                    <div className="flex-1">
                                        <span className="text-gray-500">Replying to:</span>
                                        <div className="text-gray-700 font-medium truncate max-w-md">
                                            {replyTo.text}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReplyTo(null)}
                                    className="text-gray-400 hover:text-gray-600 ml-2"
                                    title="Cancel reply"
                                >
                                    <FaTimes size={14} />
                                </button>
                            </div>
                        )}

                        {/* Edit Message Preview */}
                        {editMessage && (
                            <div className="bg-yellow-50 px-4 py-2 border-b flex justify-between items-center">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        defaultValue={editMessage.text}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                editMessageHandler(editMessage._id, e.target.value);
                                            }
                                        }}
                                        className="w-full px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>
                                <button onClick={() => setEditMessage(null)} className="ml-2 text-gray-400 hover:text-gray-600">
                                    <FaTimes size={14} />
                                </button>
                            </div>
                        )}

                        {/* Messages Area */}
                        <div
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-4 space-y-3"
                            style={{
                                backgroundColor: chatSettings.backgroundColor,
                                fontFamily: chatSettings.fontFamily
                            }}
                        >
                            {loadingMore && (
                                <div className="text-center py-2">
                                    <FaSpinner className="animate-spin mx-auto text-gray-400" />
                                    <p className="text-xs text-gray-400 mt-1">Loading older messages...</p>
                                </div>
                            )}

                            {uploadingMedia && (
                                <div className="text-center py-2">
                                    <FaSpinner className="animate-spin mx-auto text-blue-500" />
                                    <p className="text-xs text-gray-400 mt-1">Uploading media...</p>
                                </div>
                            )}


                            {messages.length === 0 && !loadingMore && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💬</div>
                                    <p className="text-gray-500">No messages yet</p>
                                    <p className="text-sm text-gray-400">Send a message to start the conversation</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                const isOwn = msg.senderId?._id === currentUser.id || msg.senderId === currentUser.id;
                                const showAvatar = !isOwn && (idx === 0 || messages[idx - 1]?.senderId?._id !== msg.senderId?._id);
                                const showDate = idx === 0 || moment(msg.createdAt).format('DD/MM/YYYY') !== moment(messages[idx - 1]?.createdAt).format('DD/MM/YYYY');
                                const isHighlighted = searchResultsInChat.some(r => r._id === msg._id) &&
                                    searchResultsInChat[currentSearchIndex]?._id === msg._id;

                                const repliedToMessage = msg.replyTo ? messages.find(m => m._id === msg.replyTo) : null;

                                return (
                                    <div key={msg._id}>
                                        {showDate && (
                                            <div className="text-center my-4">
                                                <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                                                    {moment(msg.createdAt).calendar(null, {
                                                        sameDay: '[Today]',
                                                        lastDay: '[Yesterday]',
                                                        lastWeek: 'dddd',
                                                        sameElse: 'DD/MM/YYYY'
                                                    })}
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            id={`message-${msg._id}`}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group transition-all duration-300 ${isHighlighted ? 'ring-2 ring-yellow-400 bg-yellow-50/50 rounded-lg' : ''
                                                }`}
                                            onContextMenu={(e) => handleContextMenu(e, msg)}
                                        >
                                            <div className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                                {showAvatar && !isOwn && (
                                                    <Link to={msg.senderId?.storeId?.slug ? `/shop/${msg.senderId.storeId.slug}` : '/shop'}>
                                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 hover:scale-105 transition overflow-hidden">
                                                            {msg.senderId?.storeId?.logo ? (
                                                                <img src={msg.senderId.storeId.logo} alt={msg.senderId?.username} className="w-full h-full object-cover" />
                                                            ) : (
                                                                msg.senderId?.username?.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                    </Link>
                                                )}
                                                {!showAvatar && !isOwn && <div className="w-8 flex-shrink-0"></div>}

                                                <div className="relative max-w-full">
                                                    {msg.replyTo && repliedToMessage && (
                                                        <div
                                                            onClick={() => scrollToRepliedMessage(msg.replyTo)}
                                                            className="mb-2 p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition border-l-4 border-blue-400"
                                                        >
                                                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                                                <FaReply size={10} className="text-blue-500" />
                                                                <span>Replying to {repliedToMessage.senderId?.username || 'message'}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 italic line-clamp-2 break-words">
                                                                {repliedToMessage.text?.substring(0, 100)}
                                                                {repliedToMessage.text?.length > 100 && '...'}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {msg.replyTo && !repliedToMessage && (
                                                        <div className="mb-2 p-2 bg-gray-100 rounded-lg">
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <FaReply size={10} className="text-blue-500" />
                                                                <span>Replying to a message</span>
                                                                <FaSpinner className="animate-spin ml-1" size={10} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className={`px-4 py-2 rounded-2xl break-words ${isOwn
                                                        ? 'text-white rounded-br-sm'
                                                        : 'text-gray-800 rounded-bl-sm shadow-sm'
                                                        }`}
                                                        style={{
                                                            ...(isOwn ? {
                                                                background: `linear-gradient(135deg, ${chatSettings.bubbleColor}, ${chatSettings.bubbleColor === '#3b82f6' ? '#2563eb' : '#1e40af'})`
                                                            } : {
                                                                backgroundColor: chatSettings.otherBubbleColor
                                                            }),
                                                            fontSize: chatSettings.fontSize,
                                                            fontFamily: chatSettings.fontFamily
                                                        }}>
                                                        {/* ✅ عرض الميديا (صور/فيديو) - أضف هذا أولاً */}
                                                        {msg.mediaUrl && (
                                                            <div className="mb-2 rounded-lg overflow-hidden">
                                                                {msg.type === 'image' ? (
                                                                    <img
                                                                        src={msg.mediaUrl}
                                                                        alt="Shared"
                                                                        className="max-w-full max-h-64 object-cover rounded-lg cursor-pointer"
                                                                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                                                                    />
                                                                ) : msg.type === 'video' ? (
                                                                    <video
                                                                        src={msg.mediaUrl}
                                                                        controls
                                                                        className="max-w-full max-h-64 rounded-lg"
                                                                        poster={msg.thumbnail}
                                                                    />
                                                                ) : null}
                                                            </div>
                                                        )}

                                                        {!isOwn && msg.senderId?.storeId?.name && (
                                                            <p className="text-xs text-blue-600 mb-1 font-medium">
                                                                {msg.senderId.storeId.name}
                                                            </p>
                                                        )}
                                                        <p className="whitespace-pre-wrap break-words message-text" style={{ fontSize: chatSettings.fontSize, fontFamily: chatSettings.fontFamily }}>{msg.text}</p>
                                                        {msg.isEdited && (
                                                            <span className="text-xs opacity-70 ml-1">(edited)</span>
                                                        )}
                                                    </div>

                                                    {msg.reaction && (
                                                        <div className={`absolute -bottom-2 ${isOwn ? '-left-2' : '-right-2'} bg-white rounded-full shadow-sm px-1.5 py-0.5 text-sm border`}>
                                                            {msg.reaction}
                                                        </div>
                                                    )}

                                                    {!isOwn && (
                                                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 border">
                                                            {REACTIONS.map(react => (
                                                                <button
                                                                    key={react.emoji}
                                                                    onClick={() => addReaction(msg._id, react.emoji)}
                                                                    className={`w-8 h-8 hover:bg-gray-100 rounded-full transition hover:scale-110 text-lg ${react.color}`}
                                                                    title={react.label}
                                                                >
                                                                    {react.emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className={`text-xs text-gray-400 mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                        <span>{moment(msg.createdAt).format('HH:mm')}</span>
                                                        {isOwn && (
                                                            <MessageStatus status={msg.status || (msg.isRead ? 'read' : 'delivered')} />
                                                        )}
                                                        <button
                                                            onClick={() => replyToMessage(msg)}
                                                            className="opacity-0 group-hover:opacity-100 transition hover:text-blue-500"
                                                            title="Reply"
                                                        >
                                                            <FaReply size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {showScrollButton && (
                            <button
                                onClick={scrollToBottom}
                                className="absolute bottom-24 right-8 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-10"
                            >
                                <FaLongArrowAltDown size={20} />
                            </button>
                        )}

                        <form onSubmit={sendMessage} className="p-4 bg-white border-t">
                            <div className="flex gap-2">
                                {/* Hidden file inputs */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    id="image-upload"
                                    onChange={handleImageSelect}
                                />
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    id="video-upload"
                                    onChange={handleVideoSelect}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                >
                                    <FaSmile className="text-gray-500 text-xl" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => document.getElementById('image-upload').click()}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                    title="Upload Image"
                                >
                                    <FaImage className="text-green-500 text-xl" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => document.getElementById('video-upload').click()}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                    title="Upload Video"
                                >
                                    <FaVideo className="text-red-500 text-xl" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                    title="Upload File"
                                >
                                    <FaPaperclip className="text-gray-500 text-xl" />
                                </button>

                                <input
                                    id="message-input"
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => {
                                        setMessageText(e.target.value);
                                        handleTyping();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage(e);
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <button
                                    type="submit"
                                    disabled={sending || !messageText.trim()}
                                    className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                                >
                                    {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                </button>
                            </div>

                            {showEmojiPicker && (
                                <div className="absolute bottom-20 left-4 z-10">
                                    <EmojiPicker
                                        onEmojiClick={(emoji) => {
                                            setMessageText(prev => prev + emoji.emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                    />
                                </div>
                            )}
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <FaComments size={64} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                            <p className="text-gray-500 mb-4">Select a conversation or start a new chat</p>
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition"
                            >
                                Start New Chat
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* Profile Drawer */}
            {showProfileDrawer && currentConversation?.otherUser && (
                <ProfileDrawer
                    user={currentConversation.otherUser}
                    onClose={() => setShowProfileDrawer(false)}
                    onViewStore={() => {
                        const slug = currentConversation.otherUser?.storeId?.slug;
                        if (slug) navigate(`/shop/${slug}`);
                        setShowProfileDrawer(false);
                    }}
                    onBlock={() => {
                        toast.success('User blocked');
                        setShowProfileDrawer(false);
                    }}
                    onReport={() => {
                        toast.success('User reported');
                        setShowProfileDrawer(false);
                    }}
                    sharedMedia={sharedMedia}
                    loadingMedia={loadingMedia}
                    chatSettings={chatSettings}           // ✅ أضف هذا
                    updateChatSettings={updateChatSettings} // ✅ أضف هذا
                />
            )}
            {/* ✅ Overlay عند فتح الـ Sidebar على الموبايل */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}
        </div>
    );
};

export default Chat;