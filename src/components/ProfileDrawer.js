import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes, FaUser, FaImage, FaCog, FaSpinner, FaPlay, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import moment from 'moment';
import axios from 'axios';
import ChatSettings from './ChatSettings';
import { useSound, soundOptions } from './SoundManager';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const ProfileDrawer = ({ 
  user, 
  onClose, 
  onViewStore, 
  onBlock, 
  onReport,
  conversationId,
  chatSettings,
  updateChatSettings
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [sharedMedia, setSharedMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  
  // Sound settings from context
  const {
    soundEnabled,
    setSoundEnabled,
    selectedSound,
    setSelectedSound,
    soundVolume,
    setSoundVolume,
    notificationPermission,
    requestNotificationPermission,
    playNotificationSound,
    previewSound
  } = useSound();

  useEffect(() => {
    if (activeTab === 'media' && sharedMedia.length === 0 && !loadingMedia) {
      fetchSharedMedia();
    }
  }, [activeTab]);

  const fetchSharedMedia = async () => {
    if (!conversationId) return;
    setLoadingMedia(true);
    try {
      const response = await axios.get(`${API_URL}/chat/conversations/${conversationId}/media`);
      setSharedMedia(response.data.media);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoadingMedia(false);
    }
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
          <FaCog className="inline mr-1" /> Chat Settings
        </button>
        <button
          onClick={() => setActiveTab('sounds')}
          className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'sounds' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          🔊 Sounds
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Info Tab */}
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

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div>
            {loadingMedia ? (
              <div className="flex justify-center py-8">
                <FaSpinner className="animate-spin text-blue-500 text-2xl" />
              </div>
            ) : sharedMedia.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FaImage size={48} className="mx-auto mb-2 opacity-50" />
                <p>No shared media yet</p>
                <p className="text-xs mt-1">Share images or videos to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {sharedMedia.map((media, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition"
                    onClick={() => window.open(media.url, '_blank')}
                  >
                    {media.type === 'image' ? (
                      <img src={media.url} alt="Shared" className="w-full h-full object-cover" />
                    ) : media.type === 'video' ? (
                      <video src={media.url} className="w-full h-full object-cover" />
                    ) : media.type === 'audio' ? (
                      <div className="w-full h-full flex items-center justify-center bg-purple-100">
                        <div className="text-center">
                          <div className="text-2xl mb-1">🎤</div>
                          <p className="text-xs text-gray-500">Voice Message</p>
                          <p className="text-xs text-gray-400">{media.duration ? `${Math.floor(media.duration / 60)}:${(media.duration % 60).toString().padStart(2, '0')}` : '0:00'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaImage className="text-gray-400 text-2xl" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat Settings Tab */}
        {activeTab === 'settings' && (
          <ChatSettings settings={chatSettings} onUpdate={updateChatSettings} />
        )}

        {/* Sounds Tab */}
        {activeTab === 'sounds' && (
          <div className="space-y-4">
            {/* Enable/Disable Sounds */}
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">🔊 Notification Sounds</p>
                <p className="text-xs text-gray-400">Play sound when new message arrives</p>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full transition ${soundEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Sound Selection (only if enabled) */}
            {soundEnabled && (
              <>
                <div className="py-2 border-b">
                  <p className="font-medium mb-2">🎵 Select Sound</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {soundOptions.map(sound => (
                      <button
                        key={sound.id}
                        onClick={() => setSelectedSound(sound.id)}
                        className={`p-2 rounded-lg text-sm flex items-center justify-between transition ${
                          selectedSound === sound.id ? 'bg-blue-100 border-blue-500 border' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <span className="truncate">{sound.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            previewSound(sound.id);
                          }}
                          className="p-1 hover:bg-gray-300 rounded ml-1 flex-shrink-0"
                          title="Preview"
                        >
                          <FaPlay size={12} />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume Control */}
                <div className="py-2 border-b">
                  <p className="font-medium mb-2">🔊 Volume</p>
                  <div className="flex items-center gap-3">
                    <FaVolumeMute size={16} className="text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <FaVolumeUp size={16} className="text-gray-400" />
                    <span className="text-xs w-12 text-center">{Math.round(soundVolume * 100)}%</span>
                  </div>
                </div>
              </>
            )}

            {/* Desktop Notifications */}
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">💻 Desktop Notifications</p>
                <p className="text-xs text-gray-400">Show popup when new message arrives</p>
              </div>
              <button
                onClick={requestNotificationPermission}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  notificationPermission === 'granted' ? 'bg-green-100 text-green-600' : 'bg-blue-600 text-white'
                }`}
              >
                {notificationPermission === 'granted' ? '✅ Enabled' : notificationPermission === 'denied' ? '❌ Blocked' : 'Enable'}
              </button>
            </div>

            {/* Test Sound Button */}
            {soundEnabled && (
              <button
                onClick={() => playNotificationSound()}
                className="w-full py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2 mt-2"
              >
                <FaPlay size={12} /> Test Current Sound
              </button>
            )}

            {/* Info message when sound is disabled */}
            {!soundEnabled && (
              <div className="text-center py-4 text-gray-400 text-sm">
                <FaVolumeMute size={24} className="mx-auto mb-2 opacity-50" />
                <p>Sounds are disabled</p>
                <p className="text-xs mt-1">Toggle the switch above to enable</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDrawer;