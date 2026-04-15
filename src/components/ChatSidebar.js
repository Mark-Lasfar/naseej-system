import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaComments, FaSearch, FaUserPlus, FaStar, FaTimes as FaClose } from 'react-icons/fa';
import moment from 'moment';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const ChatSidebar = ({ 
  conversations, 
  currentConversationId, 
  onSelectConversation,
  onClose,
  isOpen 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // البحث عن مستخدمين
  const searchUsers = useCallback(async () => {
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
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, [searchTerm]);

  // بدء محادثة جديدة
  const startNewChat = async (user) => {
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
    try {
      const response = await axios.post(`${API_URL}/chat/conversation`, {
        otherUserId: user._id
      });
      const conv = response.data.conversation;
      navigate(`/chat/${conv._id}`);
      onSelectConversation(conv._id);
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

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
  }, [searchTerm, searchUsers]);

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0 md:shadow-none md:z-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex flex-col h-full">
        {/* Header */}
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
            onClick={onClose}
            className="md:hidden p-2 hover:bg-gray-200 rounded-full transition"
          >
            <FaClose className="text-gray-600" />
          </button>
        </div>

        {/* Search */}
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

          {/* Search Results */}
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
                <FaUserPlus size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found matching "{searchTerm}"</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            </div>
          )}
        </div>

        {/* Conversations List */}
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
              const isActive = currentConversationId === conv._id;
              return (
                <Link
                  key={conv._id}
                  to={`/chat/${conv._id}`}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) return;
                    e.preventDefault();
                    navigate(`/chat/${conv._id}`);
                    onSelectConversation(conv._id);
                  }}
                  className={`block w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} ${conv.isPinned ? 'bg-yellow-50/30' : ''}`}
                >
                  <div className="relative flex-shrink-0">
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
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold flex items-center gap-1 truncate ${hasUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                          {conv.otherUser?.username}
                          {conv.isPinned && <FaStar size={10} className="text-yellow-500 flex-shrink-0" />}
                        </p>
                        <p className={`text-xs ${conv.otherUser?.status?.color || 'text-gray-400'} truncate`}>
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
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
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
  );
};

export default ChatSidebar;