import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaReply, FaSpinner } from 'react-icons/fa';
import moment from 'moment';
import MessageStatus from './MessageStatus';
import MessageActions from './MessageActions';
import AudioMessage from './AudioMessage';


const REACTIONS = [
  { emoji: '❤️', label: 'Love', color: 'text-red-500' },
  { emoji: '👍', label: 'Like', color: 'text-blue-500' },
  { emoji: '😂', label: 'Laugh', color: 'text-yellow-500' },
  { emoji: '😮', label: 'Wow', color: 'text-orange-500' },
  { emoji: '😢', label: 'Sad', color: 'text-blue-400' },
  { emoji: '😡', label: 'Angry', color: 'text-red-600' }
];

const MessageItem = ({
  message,
  isOwn,
  showAvatar,
  showDate,
  isHighlighted,
  chatSettings,
  currentUser,
  messages,
  searchResultsInChat,
  currentSearchIndex,
  onAddReaction,
  onReply,
  onCopy,
  onDelete,
  onReport,
  onScrollToRepliedMessage,
  onEdit,
  onContextMenu
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const repliedToMessage = message.replyTo ? messages.find(m => m._id === message.replyTo) : null;

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowActions(true);
    setTimeout(() => setShowActions(false), 3000);
  };

  return (
    <div key={`${message._id}-${message.updatedAt || message.createdAt}`}>

      {showDate && (
        <div className="text-center my-4">
          <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
            {moment(message.createdAt).calendar(null, {
              sameDay: '[Today]',
              lastDay: '[Yesterday]',
              lastWeek: 'dddd',
              sameElse: 'DD/MM/YYYY'
            })}
          </span>
        </div>
      )}

      <div
        id={`message-${message._id}`}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group transition-all duration-300 ${isHighlighted ? 'ring-2 ring-yellow-400 bg-yellow-50/50 rounded-lg' : ''}`}
        onContextMenu={handleContextMenu}
      >
        <div className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          {showAvatar && !isOwn && (
            <Link to={message.senderId?.storeId?.slug ? `/shop/${message.senderId.storeId.slug}` : '/shop'}>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 hover:scale-105 transition overflow-hidden">
                {message.senderId?.storeId?.logo ? (
                  <img src={message.senderId.storeId.logo} alt={message.senderId?.username} className="w-full h-full object-cover" />
                ) : (
                  message.senderId?.username?.charAt(0).toUpperCase()
                )}
              </div>
            </Link>
          )}
          {!showAvatar && !isOwn && <div className="w-8 flex-shrink-0"></div>}

          {/* Message Content */}
          <div className="relative max-w-full">
            {/* Reply Preview */}
            {message.replyTo && repliedToMessage && (
              <div
                onClick={() => onScrollToRepliedMessage(message.replyTo)}
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

            {message.replyTo && !repliedToMessage && (
              <div className="mb-2 p-2 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FaReply size={10} className="text-blue-500" />
                  <span>Replying to a message</span>
                  <FaSpinner className="animate-spin ml-1" size={10} />
                </div>
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`px-4 py-2 rounded-2xl break-words ${isOwn ? 'text-white rounded-br-sm' : 'text-gray-800 rounded-bl-sm shadow-sm'}`}
              style={{
                ...(isOwn ? {
                  background: `linear-gradient(135deg, ${chatSettings.bubbleColor}, ${chatSettings.bubbleColor === '#3b82f6' ? '#2563eb' : '#1e40af'})`
                } : {
                  backgroundColor: chatSettings.otherBubbleColor
                }),
                fontSize: chatSettings.fontSize,
                fontFamily: chatSettings.fontFamily
              }}
            >
{/* Media */}
{message.mediaUrl && (
  <div className="mb-2 rounded-lg overflow-hidden">
    {message.type === 'image' ? (
      <img
        src={message.mediaUrl}
        alt="Shared"
        className="max-w-full max-h-64 object-cover rounded-lg cursor-pointer"
        onClick={() => window.open(message.mediaUrl, '_blank')}
      />
    ) : message.type === 'video' ? (
      <video
        src={message.mediaUrl}
        controls
        className="max-w-full max-h-64 rounded-lg"
        poster={message.thumbnail}
      />
    ) : message.type === 'audio' ? (
      <AudioMessage src={message.mediaUrl} duration={message.duration} />
    ) : null}
  </div>
)}

              {/* Store Name */}
              {!isOwn && message.senderId?.storeId?.name && (
                <p className="text-xs text-blue-600 mb-1 font-medium">
                  {message.senderId.storeId.name}
                </p>
              )}

              {/* Message Text */}
              <p className="whitespace-pre-wrap break-words message-text">
                {message.text}
              </p>

              {/* Edited Indicator */}
              {message.isEdited && (
                <span className="text-xs opacity-70 ml-1">(edited)</span>
              )}
            </div>

            {/* Reaction */}
            {message.reaction && (
              <div className={`absolute -bottom-2 ${isOwn ? '-left-2' : '-right-2'} bg-white rounded-full shadow-sm px-1.5 py-0.5 text-sm border`}>
                {message.reaction}
              </div>
            )}

            {/* Reaction Picker (hover) */}
            {!isOwn && (
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 border">
                {REACTIONS.map(react => (
                  <button
                    key={react.emoji}
                    onClick={() => onAddReaction(message._id, react.emoji)}
                    className={`w-8 h-8 hover:bg-gray-100 rounded-full transition hover:scale-110 text-lg ${react.color}`}
                    title={react.label}
                  >
                    {react.emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Timestamp and Status */}
            <div className={`text-xs text-gray-400 mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span>{moment(message.createdAt).format('HH:mm')}</span>
              {isOwn && (
                <MessageStatus status={message.status || (message.isRead ? 'read' : 'delivered')} />
              )}
              <button
                onClick={() => onReply(message)}
                className="opacity-0 group-hover:opacity-100 transition hover:text-blue-500"
                title="Reply"
              >
                <FaReply size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Actions Context Menu */}
      {showActions && (
        <div className="fixed z-50" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <MessageActions
            message={message}
            onReply={onReply}
            onCopy={onCopy}
            onDelete={onDelete}
            onReport={onReport}
            onClose={() => setShowActions(false)}
          />
        </div>
      )}
    </div>
  );
};

export default MessageItem;