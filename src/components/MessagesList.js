import React, { useRef, useEffect } from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { FaReply, FaSpinner } from 'react-icons/fa';

const MessagesList = ({ 
  messages, 
  currentUserId, 
  loadingMore, 
  onScroll,
  onReply,
  onReaction,
  onContextMenu,
  searchResults,
  currentSearchIndex,
  chatSettings
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isHighlighted = (msgId) => {
    return searchResults.some(r => r._id === msgId) && 
           searchResults[currentSearchIndex]?._id === msgId;
  };

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto p-3 space-y-2"
      style={{
        backgroundColor: chatSettings.backgroundColor,
        fontFamily: chatSettings.fontFamily
      }}
    >
      {loadingMore && (
        <div className="text-center py-2">
          <FaSpinner className="animate-spin mx-auto text-gray-400" />
          <p className="text-xs text-gray-400 mt-1">جاري تحميل الرسائل القديمة...</p>
        </div>
      )}

      {messages.length === 0 && !loadingMore && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-gray-500">لا توجد رسائل بعد</p>
          <p className="text-sm text-gray-400">أرسل رسالة لبدء المحادثة</p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isOwn = msg.senderId?._id === currentUserId || msg.senderId === currentUserId;
        const showAvatar = !isOwn && (idx === 0 || messages[idx - 1]?.senderId?._id !== msg.senderId?._id);
        const showDate = idx === 0 || moment(msg.createdAt).format('DD/MM/YYYY') !== moment(messages[idx - 1]?.createdAt).format('DD/MM/YYYY');
        const highlighted = isHighlighted(msg._id);

        return (
          <div key={msg._id}>
            {showDate && (
              <div className="text-center my-3">
                <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                  {moment(msg.createdAt).calendar(null, {
                    sameDay: '[اليوم]',
                    lastDay: '[أمس]',
                    lastWeek: 'dddd',
                    sameElse: 'DD/MM/YYYY'
                  })}
                </span>
              </div>
            )}

            <div
              id={`message-${msg._id}`}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group transition-all ${highlighted ? 'ring-2 ring-yellow-400 bg-yellow-50/50 rounded-lg' : ''}`}
              onContextMenu={(e) => onContextMenu(e, msg)}
            >
              <div className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                {/* صورة المستخدم */}
                {showAvatar && !isOwn && (
                  <Link to={msg.senderId?.storeId?.slug ? `/shop/${msg.senderId.storeId.slug}` : '/shop'}>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 overflow-hidden">
                      {msg.senderId?.storeId?.logo ? (
                        <img src={msg.senderId.storeId.logo} alt={msg.senderId?.username} className="w-full h-full object-cover" />
                      ) : (
                        msg.senderId?.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                  </Link>
                )}
                {!showAvatar && !isOwn && <div className="w-8 flex-shrink-0"></div>}

                {/* محتوى الرسالة */}
                <div className="relative max-w-full">
                  {/* الرد على رسالة */}
                  {msg.replyTo && (
                    <div className="mb-1 p-2 bg-gray-100 rounded-lg text-xs">
                      <p className="text-gray-500">↩️ رد على: {msg.replyTo.text?.substring(0, 50)}</p>
                    </div>
                  )}

                  {/* فقاعة الرسالة */}
                  <div
                    className={`px-3 py-2 rounded-2xl break-words ${isOwn
                      ? 'text-white rounded-br-sm'
                      : 'text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                    style={{
                      ...(isOwn ? {
                        background: `linear-gradient(135deg, ${chatSettings.bubbleColor}, ${chatSettings.bubbleColor === '#3b82f6' ? '#2563eb' : '#1e40af'})`
                      } : {
                        backgroundColor: chatSettings.otherBubbleColor
                      }),
                      fontSize: chatSettings.fontSize
                    }}
                  >
                    {/* الوسائط */}
                    {msg.mediaUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden">
                        {msg.type === 'image' ? (
                          <img
                            src={msg.mediaUrl}
                            alt="مشاركة"
                            className="max-w-full max-h-48 object-cover rounded-lg cursor-pointer"
                            onClick={() => window.open(msg.mediaUrl, '_blank')}
                          />
                        ) : msg.type === 'video' ? (
                          <video
                            src={msg.mediaUrl}
                            controls
                            className="max-w-full max-h-48 rounded-lg"
                          />
                        ) : null}
                      </div>
                    )}

                    {/* النص */}
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    {msg.isEdited && <span className="text-xs opacity-70">(تم التعديل)</span>}
                  </div>

                  {/* الوقت والحالة */}
                  <div className={`text-xs text-gray-400 mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span>{moment(msg.createdAt).format('HH:mm')}</span>
                    
                    {/* زر الرد */}
                    <button
                      onClick={() => onReply(msg)}
                      className="opacity-0 group-hover:opacity-100 transition hover:text-blue-500"
                    >
                      ↩️
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
  );
};

export default MessagesList;