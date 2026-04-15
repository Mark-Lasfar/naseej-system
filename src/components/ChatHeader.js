import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaBars, FaStar, FaRegStar, FaVolumeUp, FaVolumeMute, FaEllipsisV, FaDownload, FaArchive, FaTrash, FaUserCheck, FaUserClock } from 'react-icons/fa';
import moment from 'moment';
import { useSound } from './SoundManager';

const ChatHeader = ({
  conversation,
  isPinned,
  isMuted,
  otherUserTyping,
  showSidebar,
  setShowSidebar,
  onBack,
  onTogglePin,
  onToggleMute,
  onExport,
  onArchive,
  onDelete,
  onOpenProfile
}) => {
  if (!conversation) return null;

  const otherUser = conversation.otherUser;
  const { soundEnabled, setSoundEnabled, soundVolume } = useSound();
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  // Get status icon based on user status
  const getStatusIcon = () => {
    if (otherUser?.status?.isOnline) {
      return <FaUserCheck className="text-green-500 text-xs" />;
    }
    return <FaUserClock className="text-gray-400 text-xs" />;
  };

  // Get status text with emoji
  const getStatusText = () => {
    if (otherUser?.status?.isOnline) {
      return '🟢 Online';
    }
    if (otherUser?.status?.lastSeen) {
      const lastSeen = moment(otherUser.status.lastSeen).fromNow();
      return `🕐 Last seen ${lastSeen}`;
    }
    return '⚫ Offline';
  };

  return (
    <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
      <div className="p-3 sm:p-4 flex justify-between items-center">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Menu button for mobile */}
          <button
            onClick={() => setShowSidebar(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0"
            aria-label="Open sidebar"
          >
            <FaBars className="text-gray-600 text-base sm:text-lg" />
          </button>

          {/* Back button */}
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0"
            aria-label="Go back"
          >
            <FaArrowLeft className="text-gray-600 text-base sm:text-lg" />
          </button>

          {/* User Avatar */}
          <div onClick={onOpenProfile} className="cursor-pointer flex-shrink-0 group relative">
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white overflow-hidden shadow-md group-hover:shadow-lg transition">
                {otherUser?.storeId?.logo ? (
                  <img
                    src={otherUser.storeId.logo}
                    alt={otherUser?.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  otherUser?.username?.charAt(0).toUpperCase()
                )}
              </div>
              {otherUser?.status?.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </div>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
              View profile
            </div>
          </div>

          {/* User Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <h3 className="font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-[200px] hover:text-blue-600 cursor-pointer" onClick={onOpenProfile}>
                {otherUser?.username}
              </h3>
              {otherUser?.storeId && (
                <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Seller
                </span>
              )}
            </div>

            {/* User Status with Icon */}
            <div 
              className="hidden xs:block cursor-help"
              onMouseEnter={() => setShowStatusTooltip(true)}
              onMouseLeave={() => setShowStatusTooltip(false)}
            >
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <p className="text-xs text-gray-500 truncate">
                  {getStatusText()}
                </p>
              </div>
              {/* Detailed tooltip */}
              {showStatusTooltip && otherUser?.status?.lastSeen && (
                <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-50 whitespace-nowrap">
                  Last active: {moment(otherUser.status.lastSeen).format('MMMM Do YYYY, h:mm:ss a')}
                </div>
              )}
            </div>

            {/* Typing Indicator */}
            {otherUserTyping && (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <p className="text-xs text-blue-500 animate-pulse hidden sm:block">
                  Typing...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          {/* Global Sound Toggle Button with volume indicator */}
          <div className="relative group">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition"
              title={soundEnabled ? `Sound ON (${Math.round(soundVolume * 100)}%)` : 'Sound OFF'}
            >
              {soundEnabled ? (
                <FaVolumeUp className="text-gray-600 text-sm sm:text-base" />
              ) : (
                <FaVolumeMute className="text-gray-400 text-sm sm:text-base" />
              )}
            </button>
            {/* Volume indicator tooltip */}
            {soundEnabled && (
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                Volume: {Math.round(soundVolume * 100)}%
              </div>
            )}
          </div>

          {/* Pin Button */}
          <button
            onClick={onTogglePin}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition"
            title={isPinned ? 'Unpin conversation' : 'Pin conversation'}
          >
            {isPinned ? (
              <FaStar className="text-yellow-500 text-sm sm:text-base" />
            ) : (
              <FaRegStar className="text-gray-500 text-sm sm:text-base" />
            )}
          </button>

          {/* Mute Button for this conversation only */}
          <button
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition"
            title={isMuted ? 'Unmute conversation' : 'Mute conversation (no sound for this chat)'}
          >
            {isMuted ? (
              <FaVolumeMute className="text-gray-400 text-sm sm:text-base" />
            ) : (
              <FaVolumeUp className="text-gray-500 text-sm sm:text-base" />
            )}
          </button>

          {/* More Options Dropdown */}
          <div className="relative group">
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition" aria-label="More options">
              <FaEllipsisV className="text-gray-600 text-sm sm:text-base" />
            </button>

            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20 min-w-[170px] hidden group-hover:block border">
              <button
                onClick={onExport}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3 transition"
              >
                <FaDownload size={14} className="text-blue-500" /> Export Chat
              </button>
              <button
                onClick={onArchive}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-3 transition"
              >
                <FaArchive size={14} className="text-orange-500" /> Archive
              </button>
              <hr className="my-1" />
              <button
                onClick={onDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition"
              >
                <FaTrash size={14} /> Delete Conversation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;