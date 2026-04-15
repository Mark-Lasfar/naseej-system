// src/components/ChatBubble.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaComments, FaTimes, FaPaperPlane, FaSmile, FaImage, 
  FaTrash, FaReply, FaCheck, FaCheckDouble, FaRegClock, FaPlay, FaPause,
  FaMicrophone, FaStop, FaSpinner, FaVolumeUp, FaVolumeMute
} from 'react-icons/fa';
import axios from 'axios';
import { io } from 'socket.io-client';
import moment from 'moment';
import EmojiPicker from 'emoji-picker-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://al-asfar-naseej-socket-server.hf.space';

// مكون حالة الرسالة
const MessageStatus = ({ status }) => {
  switch (status) {
    case 'sending': return <FaRegClock className="text-gray-400 text-xs" />;
    case 'sent': return <FaCheck className="text-gray-400 text-xs" />;
    case 'delivered': return <FaCheckDouble className="text-gray-400 text-xs" />;
    case 'read': return <FaCheckDouble className="text-blue-500 text-xs" />;
    default: return null;
  }
};

// مكون تسجيل الصوت المدمج
const VoiceRecorderInline = ({ onSend, conversationId, receiverId, onStartRecording, onStopRecording }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      if (onStartRecording) onStartRecording();
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error) {
      console.error('Microphone error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (onStopRecording) onStopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const sendAudioMessage = async () => {
    if (!audioBlob) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-message.webm');
    
    try {
      const uploadResponse = await axios.post(`${API_URL}/upload/audio`, formData);
      await axios.post(`${API_URL}/chat/messages`, {
        conversationId,
        receiverId,
        text: '🎤 Voice message',
        type: 'audio',
        mediaUrl: uploadResponse.data.url,
        duration: recordingTime
      });
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      onSend();
    } catch (error) {
      console.error('Failed to send voice message:', error);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, [audioUrl]);

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-red-500">Recording</span>
        <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
        <button onClick={stopRecording} className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
          <FaStop size={12} />
        </button>
      </div>
    );
  }

  if (audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
        <audio src={audioUrl} controls className="h-8 w-32" />
        <span className="text-xs text-gray-500">{formatTime(recordingTime)}</span>
        <button onClick={sendAudioMessage} disabled={uploading} className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600">
          {uploading ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
        </button>
        <button onClick={cancelRecording} className="p-1 bg-gray-400 text-white rounded-full hover:bg-gray-500">
          <FaTrash size={12} />
        </button>
      </div>
    );
  }

  return (
    <button 
      type="button"
      onClick={startRecording} 
      className="p-2 hover:bg-gray-100 rounded-full transition" 
      title="Voice message"
    >
      <FaMicrophone className="text-purple-500 text-lg" />
    </button>
  );
};

// مكون الصوت المدمج
const AudioPlayerInline = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) audio.pause();
      else audio.play();
      setIsPlaying(!isPlaying);
    }
  };

  if (!src) return <div className="text-gray-400 text-sm">🎤 Voice message...</div>;

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 min-w-[180px]">
      <button onClick={togglePlay} className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600">
        {isPlaying ? <FaStop size={12} /> : <FaPlay size={12} className="ml-0.5" />}
      </button>
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} />
      <div className="flex-1">
        <div className="h-1 bg-gray-300 rounded-full">
          <div className="w-0 h-full bg-blue-500 rounded-full" />
        </div>
      </div>
      <span className="text-lg">🎤</span>
    </div>
  );
};

const ChatBubble = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  
  const messagesEndRef = useRef(null);
  const bubbleRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // توليد صوت الإشعار
  const playNotificationSound = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.2;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
      oscillator.stop(audioCtx.currentTime + 0.3);
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (error) {}
  };

  const playSendSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 523.25;
      gainNode.gain.value = 0.15;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
      oscillator.stop(audioCtx.currentTime + 0.1);
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.value = 659.25;
        gain2.gain.value = 0.15;
        osc2.start();
        gain2.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
        osc2.stop(audioCtx.currentTime + 0.1);
      }, 80);
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (error) {}
  };

  // Socket.IO
  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true
    });
    
    socketInstance.on('connect', () => setIsSocketConnected(true));
    socketInstance.on('new_message', (newMessage) => {
      if (selectedConversation?._id === newMessage.conversationId) {
        setMessages(prev => {
          if (prev.some(m => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      fetchUnreadCount();
      fetchConversations();
      
      const isFromOther = newMessage.senderId?._id !== currentUser?.id;
      if (isFromOther && !isOpen && !isMuted) {
        playNotificationSound();
        setUnreadCount(prev => prev + 1);
      }
    });
    
    setSocket(socketInstance);
    return () => { if (socketInstance) socketInstance.disconnect(); };
  }, [currentUser, selectedConversation, isOpen, isMuted]);

  // جلب البيانات
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.conversations || []);
    } catch (error) {}
  }, [currentUser]);

  const fetchMessages = useCallback(async (conversationId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/messages/${conversationId}`, {
        params: { page: 1, limit: 50 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {}
    finally { setLoading(false); }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {}
  }, [currentUser]);

  // إرسال رسالة - ✅ مع منع تشغيل المايك
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (!selectedConversation) return;
    
    playSendSound();
    
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      text: messageText,
      senderId: { _id: currentUser.id, username: currentUser.username },
      receiverId: selectedConversation.otherUser._id,
      conversationId: selectedConversation._id,
      createdAt: new Date(),
      status: 'sending',
      replyTo: replyTo?._id || null
    };
    
    setMessages(prev => [...prev, tempMessage]);
    const textToSend = messageText;
    const replyToId = replyTo?._id || null;
    setMessageText('');
    setReplyTo(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/chat/messages`, {
        conversationId: selectedConversation._id,
        receiverId: selectedConversation.otherUser._id,
        text: textToSend,
        replyTo: replyToId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setMessages(prev => prev.map(msg => msg._id === tempId ? response.data.message : msg));
      fetchConversations();
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  const replyToMessage = (message) => {
    setReplyTo(message);
    document.getElementById('chat-bubble-input')?.focus();
  };

  const deleteMessage = async (messageId) => {
    if (window.confirm('Delete this message?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/chat/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      } catch (error) {}
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setShowSidebar(false);
    setReplyTo(null);
    await fetchMessages(conversation._id);
    const newUnread = Math.max(0, unreadCount - (conversation.unreadCount || 0));
    setUnreadCount(newUnread);
  };

  // السحب
  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-window')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    setPosition({
      x: Math.min(Math.max(0, newX), maxX),
      y: Math.min(Math.max(0, newY), maxY)
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // تحديث العداد التلقائي
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [currentUser, fetchConversations, fetchUnreadCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) fetchUnreadCount();
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen, fetchUnreadCount]);

  if (!currentUser) return null;

  // ✅ دالة مساعدة لتحديد إذا كانت الرسالة من المستخدم الحالي
  const isOwnMessage = (msg) => {
    const senderId = msg.senderId?._id || msg.senderId;
    const currentUserId = currentUser?.id || currentUser?._id;
    return senderId === currentUserId;
  };

  return (
    <>
      {/* Chat Bubble - زر عائم قابل للسحب */}
      <div
        ref={bubbleRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 1000
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center relative group"
        >
          {isOpen ? (
            <FaTimes className="text-white text-xl" />
          ) : (
            <>
              <FaComments className="text-white text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-white/30 rounded-full group-hover:bg-white/50 transition" />
            </>
          )}
        </button>
      </div>

      {/* نافذة الشات */}
      {isOpen && (
        <div
          className="fixed bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[1001]"
          style={{
            width: '380px',
            height: '550px',
            bottom: '20px',
            right: '20px',
            maxWidth: 'calc(100vw - 40px)',
            maxHeight: 'calc(100vh - 100px)'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Messages</h3>
              <p className="text-xs opacity-80">Chat with sellers</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsMuted(!isMuted)} className="p-1 hover:bg-white/20 rounded-full transition" title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition">
                <FaTimes />
              </button>
            </div>
          </div>

          {showSidebar ? (
            // قائمة المحادثات
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaComments size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-xs mt-1">Start chatting with sellers</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv._id}
                    onClick={() => selectConversation(conv)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                        {conv.otherUser?.storeId?.logo ? (
                          <img src={conv.otherUser.storeId.logo} alt={conv.otherUser?.username} className="w-full h-full object-cover" />
                        ) : (
                          conv.otherUser?.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      {conv.otherUser?.status?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800">{conv.otherUser?.username}</p>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          ) : (
            // نافذة المحادثة
            <>
              {/* Conversation Header */}
              {selectedConversation && (
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b">
                  <button onClick={() => setShowSidebar(true)} className="text-gray-600 hover:text-gray-800 text-lg">
                    ←
                  </button>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {selectedConversation.otherUser?.storeId?.logo ? (
                      <img src={selectedConversation.otherUser.storeId.logo} alt={selectedConversation.otherUser?.username} className="w-full h-full object-cover" />
                    ) : (
                      selectedConversation.otherUser?.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{selectedConversation.otherUser?.username}</p>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.otherUser?.status?.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </p>
                  </div>
                  <button onClick={() => setIsMuted(!isMuted)} className="text-gray-500 hover:text-gray-700">
                    {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
                  </button>
                </div>
              )}

              {/* Reply Preview */}
              {replyTo && (
                <div className="bg-blue-50 px-3 py-2 border-b flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs flex-1">
                    <FaReply className="text-blue-400" />
                    <span className="text-gray-500">Replying to:</span>
                    <span className="text-gray-700 truncate">{replyTo.text}</span>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
                    <FaTimes size={12} />
                  </button>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>No messages yet</p>
                    <p className="text-xs mt-1">Send a message to start chatting</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    // ✅ تحديد إذا كانت الرسالة من المستخدم الحالي
                    const isOwn = isOwnMessage(msg);
                    const showAvatar = !isOwn && (idx === 0 || isOwnMessage(messages[idx - 1]) !== isOwn);
                    const repliedToMessage = msg.replyTo ? messages.find(m => m._id === msg.replyTo) : null;
                    
                    return (
                      <div key={`${msg._id}-${idx}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {showAvatar && !isOwn && (
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 overflow-hidden">
                              {msg.senderId?.storeId?.logo ? (
                                <img src={msg.senderId.storeId.logo} alt={msg.senderId?.username} className="w-full h-full object-cover" />
                              ) : (
                                msg.senderId?.username?.charAt(0).toUpperCase()
                              )}
                            </div>
                          )}
                          <div className="relative max-w-full">
                            {msg.replyTo && repliedToMessage && (
                              <div className="mb-1 p-1.5 bg-gray-100 rounded text-xs border-l-2 border-blue-400">
                                <span className="text-gray-500">↩️ {repliedToMessage.senderId?.username}</span>
                                <p className="text-gray-600 truncate">{repliedToMessage.text?.substring(0, 50)}</p>
                              </div>
                            )}
                            <div
                              className={`px-3 py-2 rounded-2xl break-words ${
                                isOwn
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm'
                                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                              }`}
                            >
                              {msg.type === 'audio' ? (
                                <AudioPlayerInline src={msg.mediaUrl} />
                              ) : msg.type === 'image' ? (
                                <img src={msg.mediaUrl} alt="Shared" className="max-w-full max-h-32 rounded-lg cursor-pointer" onClick={() => window.open(msg.mediaUrl, '_blank')} />
                              ) : (
                                <p className="text-sm">{msg.text}</p>
                              )}
                              {msg.isEdited && <span className="text-xs opacity-70 ml-1">(edited)</span>}
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 text-xs text-gray-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span>{moment(msg.createdAt).format('HH:mm')}</span>
                              {isOwn && <MessageStatus status={msg.status || (msg.isRead ? 'read' : 'delivered')} />}
                              <button onClick={() => replyToMessage(msg)} className="opacity-0 group-hover:opacity-100 transition hover:text-blue-500">
                                <FaReply size={10} />
                              </button>
                              {isOwn && (
                                <button onClick={() => deleteMessage(msg._id)} className="opacity-0 group-hover:opacity-100 transition hover:text-red-500">
                                  <FaTrash size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - ✅ مع منع تشغيل المايك عند الضغط على Enter */}
              <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <FaSmile className="text-gray-500" />
                </button>
                <VoiceRecorderInline
                  onSend={() => { fetchMessages(selectedConversation?._id); fetchConversations(); }}
                  conversationId={selectedConversation?._id}
                  receiverId={selectedConversation?.otherUser?._id}
                  onStartRecording={() => setIsRecordingActive(true)}
                  onStopRecording={() => setIsRecordingActive(false)}
                />
                <input
                  id="chat-bubble-input"
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    // ✅ منع تشغيل التسجيل عند الضغط على Enter
                    if (e.key === 'Enter' && !e.shiftKey && !isRecordingActive) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || isRecordingActive}
                  className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg transition disabled:opacity-50"
                >
                  <FaPaperPlane size={14} />
                </button>
              </form>

              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 z-10">
                  <EmojiPicker onEmojiClick={(emoji) => { setMessageText(prev => prev + emoji.emoji); setShowEmojiPicker(false); }} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBubble;