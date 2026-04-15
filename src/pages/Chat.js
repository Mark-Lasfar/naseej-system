import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import moment from 'moment';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { io } from 'socket.io-client';
// Components
import ChatSidebar from '../components/ChatSidebar';
import ProfileDrawer from '../components/ProfileDrawer';
import EditPreview from '../components/EditPreview';
import SearchInChat from '../components/SearchInChat';
import MessageItem from '../components/MessageItem';
import ChatFooter from '../components/ChatFooter';
import ChatHeader from '../components/ChatHeader';
import ReplyPreview from '../components/ReplyPreview';
import SoundProvider, { useSound } from '../components/SoundManager';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

// Query keys
const QUERY_KEYS = {
    conversations: 'conversations',
    messages: (convId) => ['messages', convId],
    chatSettings: (convId) => ['chatSettings', convId],
};

const Chat = () => {
    const navigate = useNavigate();
    const { conversationId: urlConversationId } = useParams();
    const queryClient = useQueryClient();

    // Sound hooks
    const { playNotificationSound, playSendSound, showNotification, soundEnabled } = useSound();

    // State

    const [socket, setSocket] = useState(null);
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    const [currentConversation, setCurrentConversation] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [editMessage, setEditMessage] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showProfileDrawer, setShowProfileDrawer] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [searchInChat, setSearchInChat] = useState('');
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [searchResultsInChat, setSearchResultsInChat] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [chatSettings, setChatSettings] = useState({
        bubbleColor: '#3b82f6',
        otherBubbleColor: '#f3f4f6',
        backgroundColor: '#f9fafb',
        fontFamily: 'sans-serif',
        fontSize: '14px'
    });

    // Refs
    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeout = useRef(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // ================ React Query Hooks (✅ المعدلة) ================

    // جلب المحادثات - مرة واحدة فقط
    const { data: conversations = [], refetch: refetchConversations } = useQuery({
        queryKey: [QUERY_KEYS.conversations],
        queryFn: async () => {
            console.log('📋 Fetching conversations (ONCE)');
            const response = await axios.get(`${API_URL}/chat/conversations`);
            return response.data?.conversations || [];
        },
        staleTime: 10 * 60 * 1000, // 10 دقائق
        refetchOnWindowFocus: false, // ❌ لا تعيد الجلب عند التركيز
        refetchInterval: false, // ❌ لا Polling
        refetchOnReconnect: false,
        gcTime: 15 * 60 * 1000,
    });

    // جلب الرسائل - فقط عند فتح المحادثة
    const {
        data: messages = [],
        refetch: refetchMessages,
        isLoading: messagesLoading
    } = useQuery({
        queryKey: QUERY_KEYS.messages(urlConversationId),
        queryFn: async () => {
            if (!urlConversationId || urlConversationId === 'new') return [];
            console.log(`📥 Fetching messages for conversation ${urlConversationId} (ONCE)`);
            const response = await axios.get(`${API_URL}/chat/messages/${urlConversationId}`, {
                params: { page: 1, limit: 100 }
            });
            return response.data?.messages || [];
        },
        enabled: !!urlConversationId && urlConversationId !== 'new',
        staleTime: 10 * 60 * 1000, // 10 دقائق - بدون إعادة جلب تلقائي
        refetchOnWindowFocus: false, // ❌ مهم جداً
        refetchInterval: false, // ❌ مهم جداً
        refetchOnReconnect: false,
        gcTime: 15 * 60 * 1000,
    });

    // جلب إعدادات المحادثة
    const { data: fetchedSettings } = useQuery({
        queryKey: QUERY_KEYS.chatSettings(urlConversationId),
        queryFn: async () => {
            if (!urlConversationId) return {};
            const response = await axios.get(`${API_URL}/chat/conversations/${urlConversationId}/settings`);
            return response.data?.settings || {};
        },
        enabled: !!urlConversationId,
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchInterval: false,
    });

    // إرسال رسالة
    const sendMessageMutation = useMutation({
        mutationFn: async ({ text, replyToId }) => {
            const response = await axios.post(`${API_URL}/chat/messages`, {
                conversationId: urlConversationId,
                receiverId: currentConversation?.otherUser?._id,
                text,
                replyTo: replyToId || null
            });
            return response.data.message;
        },
        onSuccess: () => {
            // ✅ فقط هنا يتم إعادة جلب الرسائل (عند إرسال رسالة جديدة)
            refetchMessages();
            refetchConversations();
            playSendSound();
            setMessageText('');
            setReplyTo(null);
            setTimeout(() => scrollToBottom(), 100);
        },
        onError: () => {
            toast.error('Failed to send message');
        }
    });

    // جلب المحادثة الحالية
    const loadConversation = useCallback(async (convId) => {
        if (!convId || convId === 'new') return;

        try {
            const response = await axios.get(`${API_URL}/chat/conversation/${convId}`);
            const conversation = response.data.conversation;
            setCurrentConversation(conversation);
            setIsPinned(conversation.settings?.isPinned || false);
            setIsMuted(conversation.settings?.isMuted || false);

            if (window.innerWidth < 768) setShowSidebar(false);
        } catch (error) {
            console.error('Failed to load conversation:', error);
            toast.error('Failed to load conversation');
        }
    }, []);

    // تحديث إعدادات المحادثة
    const updateChatSettings = async (settings) => {
        try {
            await axios.put(`${API_URL}/chat/conversations/${urlConversationId}/settings`, settings);
            setChatSettings(prev => ({ ...prev, ...settings }));
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatSettings(urlConversationId) });
            toast.success('Chat settings updated');
        } catch (error) {
            toast.error('Failed to update settings');
        }
    };

    // Typing Handler
    // حالة الكتابة (معدلة لدعم Socket.IO)
    const handleTyping = useCallback(() => {
        if (!urlConversationId) return;
        if (typingTimeout.current) clearTimeout(typingTimeout.current);

        // إرسال عبر Socket.IO إذا كان متصلاً
        if (socket && isSocketConnected) {
            socket.emit('typing', {
                conversationId: urlConversationId,
                isTyping: true
            });
        } else {
            // Fallback إلى REST API
            axios.post(`${API_URL}/chat/typing`, {
                conversationId: urlConversationId,
                isTyping: true
            }).catch(err => console.error('Typing error:', err));
        }

        typingTimeout.current = setTimeout(() => {
            if (socket && isSocketConnected) {
                socket.emit('typing', {
                    conversationId: urlConversationId,
                    isTyping: false
                });
            } else {
                axios.post(`${API_URL}/chat/typing`, {
                    conversationId: urlConversationId,
                    isTyping: false
                }).catch(err => console.error('Typing error:', err));
            }
        }, 1000);
    }, [urlConversationId, socket, isSocketConnected]);

    // كشف الرسائل الجديدة - بدون Polling
    useEffect(() => {
        if (!messages.length) return;

        const newestMessage = messages[0];
        const isFromOther = newestMessage?.senderId?._id !== currentUser.id;

        if (isFromOther && !isMuted && soundEnabled) {
            playNotificationSound();

            const messagePreview = newestMessage?.text
                ? newestMessage.text.substring(0, 100)
                : (newestMessage?.type === 'image' ? '📷 Image' :
                    newestMessage?.type === 'video' ? '🎥 Video' :
                        newestMessage?.type === 'audio' ? '🎤 Voice message' : 'New message');

            showNotification(
                `📩 New message from ${currentConversation?.otherUser?.username || 'Someone'}`,
                messagePreview,
                currentConversation?.otherUser?.storeId?.logo
            );

            refetchConversations();

            const container = messagesContainerRef.current;
            if (container && container.scrollHeight - container.scrollTop - container.clientHeight < 300) {
                setTimeout(() => scrollToBottom(), 100);
            }
        }
    }, [messages, isMuted, soundEnabled, currentConversation, playNotificationSound, showNotification, refetchConversations, currentUser.id]);

    // تحديث الإعدادات
    useEffect(() => {
        if (fetchedSettings) {
            setChatSettings(prev => ({ ...prev, ...fetchedSettings }));
        }
    }, [fetchedSettings]);

    // جلب المحادثة عند تغيير الـ URL
    useEffect(() => {
        if (urlConversationId && urlConversationId !== 'new') {
            loadConversation(urlConversationId);
        } else {
            setCurrentConversation(null);
        }
    }, [urlConversationId, loadConversation]);



    // ================ Socket.IO Connection ================
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://al-asfar-naseej-socket-server.hf.space';

        console.log('🔌 Connecting to Socket.IO server:', SOCKET_URL);

        const socketInstance = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        socketInstance.on('connect', () => {
            console.log('✅ Socket.IO connected');
            setIsSocketConnected(true);

            // انضمام إلى المحادثة الحالية
            if (urlConversationId && urlConversationId !== 'new') {
                socketInstance.emit('join_conversation', urlConversationId);
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
            setIsSocketConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            setIsSocketConnected(false);
        });


        socketInstance.on('new_message', (newMessage) => {
            console.log('📨 New message received via Socket.IO:', newMessage);

            // ✅ تحديث cache مع منع التكرار
            queryClient.setQueryData(QUERY_KEYS.messages(urlConversationId), (old) => {
                if (!old) return [newMessage];
                // ✅ تجنب إضافة نفس الرسالة مرتين
                if (old.some(m => m._id === newMessage._id)) return old;
                return [...old, newMessage];
            });

            // تشغيل الصوت والإشعارات للرسائل الواردة من الآخرين
            const isFromOther = newMessage.senderId?._id !== currentUser.id;
            if (isFromOther && !isMuted && soundEnabled) {
                playNotificationSound();
                showNotification(
                    `📩 New message from ${newMessage.senderId?.username || 'Someone'}`,
                    newMessage.text?.substring(0, 100) || 'New message',
                    newMessage.senderId?.storeId?.logo
                );
                refetchConversations();
            }

            setTimeout(() => scrollToBottom(), 100);
        });

        socketInstance.on('user_typing', ({ userId, isTyping, conversationId }) => {
            if (conversationId === urlConversationId && userId !== currentUser.id) {
                setOtherUserTyping(isTyping);
                // إخفاء حالة الكتابة بعد 2 ثانية إذا لم يتم تحديثها
                setTimeout(() => setOtherUserTyping(false), 2000);
            }
        });

        socketInstance.on('new_reaction', ({ messageId, reaction, userId, username }) => {
            // ✅ تحديث cache باستخدام queryClient
            queryClient.setQueryData(QUERY_KEYS.messages(urlConversationId), (old) => {
                if (!old) return old;
                return old.map(msg =>
                    msg._id === messageId
                        ? { ...msg, reaction: reaction, reactionBy: userId, reactionByUsername: username }
                        : msg
                );
            });
        });

        socketInstance.on('message_read', ({ messageId, readerId, readerName }) => {
            // ✅ تحديث cache باستخدام queryClient
            queryClient.setQueryData(QUERY_KEYS.messages(urlConversationId), (old) => {
                if (!old) return old;
                return old.map(msg =>
                    msg._id === messageId && msg.senderId?._id === currentUser.id
                        ? { ...msg, isRead: true, readAt: new Date(), readBy: readerName }
                        : msg
                );
            });
        });
        setSocket(socketInstance);

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, []);




    // انضمام إلى غرفة المحادثة عند تغيير الـ URL
    useEffect(() => {
        if (socket && isSocketConnected && urlConversationId && urlConversationId !== 'new') {
            socket.emit('join_conversation', urlConversationId);

            // تنظيف عند مغادرة المحادثة
            return () => {
                socket.emit('leave_conversation', urlConversationId);
            };
        }
    }, [urlConversationId, socket, isSocketConnected]);

    // إرسال رسالة


    // إرسال رسالة (معدلة)
    const sendMessage = (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        if (!urlConversationId) return;
        if (!currentConversation) return;

        const tempId = `temp_${Date.now()}`;
        const textToSend = messageText;
        const replyToId = replyTo?._id || null;

        // ✅ التحقق من عدم وجود نفس الرسالة مؤقتاً
        const existingTemp = queryClient.getQueryData(QUERY_KEYS.messages(urlConversationId));
        if (existingTemp?.some(m => m._id === tempId)) {
            return; // الرسالة موجودة بالفعل
        }

        // إضافة رسالة مؤقتة للواجهة (optimistic update)
        const tempMessage = {
            _id: tempId,
            text: textToSend,
            senderId: { _id: currentUser.id, username: currentUser.username },
            receiverId: currentConversation.otherUser._id,
            conversationId: urlConversationId,
            createdAt: new Date(),
            status: 'sending'
        };

        // ✅ تحديث cache
        queryClient.setQueryData(QUERY_KEYS.messages(urlConversationId), (old) => {
            if (!old) return [tempMessage];
            // ✅ تجنب التكرار
            if (old.some(m => m._id === tempId)) return old;
            return [...old, tempMessage];
        });

        setMessageText('');
        setReplyTo(null);
        setTimeout(() => scrollToBottom(), 50);

        // محاولة الإرسال عبر Socket.IO أولاً
        if (socket && isSocketConnected) {
            socket.emit('send_message', {
                conversationId: urlConversationId,
                receiverId: currentConversation.otherUser._id,
                text: textToSend,
                type: 'text',
                replyTo: replyToId
            }, (response) => {
                if (response?.success) {
                    // ✅ استبدال الرسالة المؤقتة بالرسالة الحقيقية
                    queryClient.setQueryData(QUERY_KEYS.messages(urlConversationId), (old) => {
                        if (!old) return [response.message];
                        // ✅ تجنب التكرار
                        if (old.some(m => m._id === response.message._id)) {
                            return old.filter(m => m._id !== tempId);
                        }
                        return old.map(msg => msg._id === tempId ? response.message : msg);
                    });
                    refetchConversations();
                    playSendSound();
                } else {
                    // ✅ إزالة الرسالة المؤقتة إذا فشل الإرسال
                    queryClient.setQueryData(QUERY_KEYS.messages(urlConversationId), (old) => {
                        if (!old) return old;
                        return old.filter(msg => msg._id !== tempId);
                    });
                    toast.error('Failed to send message via Socket.IO');
                }
            });
        } else {
            sendMessageMutation.mutate({ text: textToSend, replyToId: replyToId });
            setTimeout(() => {
                queryClient.setQueryData(QUERY_KEYS.messages(urlConversationId), (old) => {
                    if (!old) return old;
                    return old.filter(msg => msg._id !== tempId);
                });
            }, 1000);
        }
    };

    // Scroll Functions
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const scrollToMessage = (messageId) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-yellow-100', 'transition-all', 'duration-500');
            setTimeout(() => element.classList.remove('bg-yellow-100'), 2000);
        }
    };

    // Search in Chat
    useEffect(() => {
        if (!searchInChat.trim()) {
            setSearchResultsInChat([]);
            setCurrentSearchIndex(-1);
            return;
        }
        const results = messages.filter(msg => msg.text?.toLowerCase().includes(searchInChat.toLowerCase()));
        setSearchResultsInChat(results);
        setCurrentSearchIndex(results.length > 0 ? 0 : -1);
        if (results.length > 0) {
            scrollToMessage(results[0]._id);
            toast.success(`Found ${results.length} message(s)`);
        }
    }, [searchInChat, messages]);

    // ❌ إزالة useEffect الخاص بـ refetch على focus - غير ضروري الآن
    // ✅ استبدل بـ useEffect لتحديث فقط عند العودة للصفحة يدوياً
    useEffect(() => {
        const handleFocus = () => {
            // اختياري: ممكن تعمل refetch يدوي مرة واحدة عند العودة
            // لكن مش ضروري لأن البيانات لسه fresh
            console.log('Window focused - no automatic refetch');
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // تنظيف عند الخروج
    useEffect(() => {
        return () => {
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
        };
    }, []);

    // ================ Message Actions ================
    // إضافة تفاعل (معدلة لدعم Socket.IO)
    // إضافة تفاعل (معدلة)
    const addReaction = async (messageId, reaction) => {
        try {
            // تحديث الواجهة محلياً أولاً (optimistic update)
            queryClient.setQueryData(QUERY_KEYS.messages(urlConversationId), (old) => {
                return old.map(msg =>
                    msg._id === messageId ? { ...msg, reaction: reaction } : msg
                );
            });

            // إرسال عبر Socket.IO إذا كان متصلاً
            if (socket && isSocketConnected && currentConversation?.otherUser?._id) {
                socket.emit('add_reaction', {
                    messageId,
                    reaction,
                    receiverId: currentConversation.otherUser._id
                });
            }

            // حفظ في قاعدة البيانات عبر REST API
            await axios.post(`${API_URL}/chat/messages/${messageId}/reaction`, { reaction });

            toast.success(`Reacted with ${reaction}`);
        } catch (error) {
            console.error('Add reaction error:', error);
            // ✅ استرجاع الحالة القديمة إذا فشل
            refetchMessages();
        }
    };

    const replyToMessage = (message) => {
        setReplyTo(message);
        setMessageText('');
        document.getElementById('message-input')?.focus();
    };

    const copyMessage = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Message copied');
    };

    const deleteMessage = async (messageId) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                // ✅ حذف من cache أولاً
                queryClient.setQueryData(QUERY_KEYS.messages(urlConversationId), (old) => {
                    return old.filter(msg => msg._id !== messageId);
                });

                await axios.delete(`${API_URL}/chat/messages/${messageId}`);
                toast.success('Message deleted');
            } catch (error) {
                // ✅ استرجاع البيانات إذا فشل الحذف
                refetchMessages();
                toast.error('Failed to delete message');
            }
        }
    };


    const reportMessage = async (messageId) => {
        try {
            await axios.post(`${API_URL}/chat/messages/${messageId}/report`);
            toast.success('Message reported to admin');
        } catch (error) {
            toast.error('Failed to report message');
        }
    };

    const scrollToRepliedMessage = (replyToId) => {
        scrollToMessage(replyToId);
    };

    // Conversation Actions
    const togglePinConversation = async () => {
        try {
            await axios.put(`${API_URL}/chat/conversations/${urlConversationId}/pin`, { isPinned: !isPinned });
            setIsPinned(!isPinned);
            toast.success(isPinned ? 'Conversation unpinned' : 'Conversation pinned');
            refetchConversations();
        } catch (error) {
            toast.error('Failed to pin conversation');
        }
    };

    const toggleMuteConversation = async () => {
        try {
            await axios.put(`${API_URL}/chat/conversations/${urlConversationId}/mute`, { isMuted: !isMuted });
            setIsMuted(!isMuted);
            toast.success(isMuted ? 'Conversation unmuted' : 'Conversation muted');
        } catch (error) {
            toast.error('Failed to mute conversation');
        }
    };

    const archiveConversation = async () => {
        try {
            await axios.put(`${API_URL}/chat/conversations/${urlConversationId}/archive`);
            toast.success('Conversation archived');
            navigate('/chat');
            refetchConversations();
        } catch (error) {
            toast.error('Failed to archive conversation');
        }
    };

    const deleteConversation = async () => {
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            try {
                await axios.delete(`${API_URL}/chat/conversations/${urlConversationId}`);
                toast.success('Conversation deleted');
                navigate('/chat');
                refetchConversations();
            } catch (error) {
                toast.error('Failed to delete conversation');
            }
        }
    };

    const exportConversation = async () => {
        try {
            const response = await axios.get(`${API_URL}/chat/conversations/${urlConversationId}/export`);
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-${currentConversation?.otherUser?.username}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Conversation exported');
        } catch (error) {
            toast.error('Failed to export conversation');
        }
    };

    // File Upload Handlers
    const uploadFile = async (file, type = 'image') => {
        const formData = new FormData();
        const endpoint = type === 'video' ? '/upload/video' : '/upload';
        formData.append(type === 'video' ? 'video' : 'image', file);
        try {
            const response = await axios.post(`${API_URL}${endpoint}`, formData);
            return response.data;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    };

    const uploadMultipleFiles = async (files) => {
        const formData = new FormData();
        for (let file of files) formData.append('media', file);
        try {
            const response = await axios.post(`${API_URL}/upload/multiple`, formData);
            return response.data;
        } catch (error) {
            console.error('Multiple upload failed:', error);
            throw error;
        }
    };

    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setUploadingMedia(true);
        try {
            const uploadResult = await uploadMultipleFiles(files);
            for (const file of uploadResult.files) {
                await axios.post(`${API_URL}/chat/messages`, {
                    conversationId: urlConversationId,
                    receiverId: currentConversation?.otherUser?._id,
                    text: '',
                    type: file.type,
                    mediaUrl: file.url
                });
            }
            toast.success(`${uploadResult.count} file(s) uploaded and sent`);
            refetchMessages();
            setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            toast.error('Failed to upload files');
        } finally {
            setUploadingMedia(false);
            e.target.value = '';
        }
    };

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
            await axios.post(`${API_URL}/chat/messages`, {
                conversationId: urlConversationId,
                receiverId: currentConversation?.otherUser?._id,
                text: '',
                type: 'video',
                mediaUrl: uploadResult.url
            });
            toast.success('Video uploaded and sent');
            refetchMessages();
            setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            toast.error('Failed to upload video');
        } finally {
            setUploadingMedia(false);
            e.target.value = '';
        }
    };

    const handleFileSelect = handleImageSelect;

    // Scroll Handler
    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    if (messagesLoading && !messages.length) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-72px)] bg-gray-100 overflow-hidden relative">
            {/* Sidebar */}
            <ChatSidebar
                conversations={conversations}
                currentConversationId={urlConversationId}
                onSelectConversation={(id) => navigate(`/chat/${id}`)}
                onClose={() => setShowSidebar(false)}
                isOpen={showSidebar}
            />

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
                {currentConversation ? (
                    <>
                        {/* Header */}
                        <ChatHeader
                            conversation={currentConversation}
                            isPinned={isPinned}
                            isMuted={isMuted}
                            otherUserTyping={otherUserTyping}
                            showSidebar={showSidebar}
                            setShowSidebar={setShowSidebar}
                            onBack={() => navigate('/chat')}
                            onTogglePin={togglePinConversation}
                            onToggleMute={toggleMuteConversation}
                            onExport={exportConversation}
                            onArchive={archiveConversation}
                            onDelete={deleteConversation}
                            onOpenProfile={() => setShowProfileDrawer(true)}
                        />

                        {/* Search Bar */}
                        <SearchInChat
                            searchInChat={searchInChat}
                            setSearchInChat={setSearchInChat}
                            searchResultsCount={searchResultsInChat.length}
                            currentSearchIndex={currentSearchIndex}
                            onPrevResult={() => {
                                const newIndex = currentSearchIndex - 1;
                                const finalIndex = newIndex < 0 ? searchResultsInChat.length - 1 : newIndex;
                                setCurrentSearchIndex(finalIndex);
                                scrollToMessage(searchResultsInChat[finalIndex]._id);
                            }}
                            onNextResult={() => {
                                const newIndex = (currentSearchIndex + 1) % searchResultsInChat.length;
                                setCurrentSearchIndex(newIndex);
                                scrollToMessage(searchResultsInChat[newIndex]._id);
                            }}
                            onClear={() => setSearchInChat('')}
                        />

                        {/* Reply/Edit Preview */}
                        <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />
                        <EditPreview
                            editMessage={editMessage}
                            onSave={async (id, text) => {
                                try {
                                    await axios.put(`${API_URL}/chat/messages/${id}`, { text });
                                    refetchMessages();
                                    setEditMessage(null);
                                    toast.success('Message edited');
                                } catch (error) {
                                    toast.error('Failed to edit message');
                                }
                            }}
                            onCancel={() => setEditMessage(null)}
                        />

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
                            {uploadingMedia && (
                                <div className="text-center py-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-xs text-gray-400 mt-1">Uploading media...</p>
                                </div>
                            )}

                            {messages.length === 0 && !messagesLoading && (
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
                                const isHighlighted = searchResultsInChat.some(r => r._id === msg._id) && searchResultsInChat[currentSearchIndex]?._id === msg._id;

                                return (
                                    <MessageItem
                                        key={msg._id}
                                        message={msg}
                                        isOwn={isOwn}
                                        showAvatar={showAvatar}
                                        showDate={showDate}
                                        isHighlighted={isHighlighted}
                                        chatSettings={chatSettings}
                                        currentUser={currentUser}
                                        messages={messages}
                                        searchResultsInChat={searchResultsInChat}
                                        currentSearchIndex={currentSearchIndex}
                                        onAddReaction={addReaction}
                                        onReply={replyToMessage}
                                        onCopy={copyMessage}
                                        onDelete={deleteMessage}
                                        onReport={reportMessage}
                                        onScrollToRepliedMessage={scrollToRepliedMessage}
                                        onEdit={(msg) => setEditMessage(msg)}
                                        onContextMenu={() => { }}
                                    />
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Scroll to Bottom Button */}
                        {showScrollButton && (
                            <button
                                onClick={scrollToBottom}
                                className="absolute bottom-24 right-8 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-10"
                            >
                                ↓
                            </button>
                        )}

                        {/* Footer */}
                        <ChatFooter
                            messageText={messageText}
                            setMessageText={setMessageText}
                            onSendMessage={sendMessage}
                            onTyping={handleTyping}
                            sending={sendMessageMutation.isPending}
                            uploadingMedia={uploadingMedia}
                            onImageSelect={handleImageSelect}
                            onVideoSelect={handleVideoSelect}
                            onFileSelect={handleFileSelect}
                            conversationId={urlConversationId}
                            receiverId={currentConversation?.otherUser?._id}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-6xl mb-4">💬</div>
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
                    conversationId={urlConversationId}
                    chatSettings={chatSettings}
                    updateChatSettings={updateChatSettings}
                />
            )}

            {/* Overlay for sidebar on mobile */}
            {showSidebar && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setShowSidebar(false)} />
            )}
        </div>
    );
};

// Wrapper with SoundProvider
const ChatWithSound = () => {
    return (
        <SoundProvider>
            <Chat />
        </SoundProvider>
    );
};

export default ChatWithSound;