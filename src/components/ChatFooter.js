import React, { useRef, useState } from 'react';
import { FaSmile, FaImage, FaVideo, FaPaperclip, FaPaperPlane,FaMicrophone, FaSpinner } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import VoiceRecorder from './VoiceRecorder';
import { useSound } from './SoundManager';

const ChatFooter = ({
  messageText,
  setMessageText,
  onSendMessage,
  onTyping,
  sending,
  uploadingMedia,
  onImageSelect,
  onVideoSelect,
  onFileSelect,
  conversationId,
  receiverId
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef(null);
  const { playSendSound, playRecordStartSound, playRecordStopSound } = useSound();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e);
      playSendSound();
    }
  };

  const handleSendClick = (e) => {
    if (messageText.trim()) {
      playSendSound();
    }
    onSendMessage(e);
  };

  const handleVoiceRecordStart = () => {
    playRecordStartSound();
  };

  const handleVoiceRecordStop = () => {
    playRecordStopSound();
  };

  const handleVoiceSend = () => {
    setShowVoiceRecorder(false);
  };

  const handleVoiceCancel = () => {
    setShowVoiceRecorder(false);
  };

  return (
    <form onSubmit={handleSendClick} className="chat-footer p-3 sm:p-4 bg-white border-t">
      {/* First row - Media Buttons */}
      <div className="flex flex-wrap gap-2 mb-2 sm:mb-0">
        <div className="flex gap-1 w-full sm:w-auto justify-center sm:justify-start flex-wrap">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <FaSmile className="text-gray-500 text-lg sm:text-xl" />
          </button>

          <button
            type="button"
            onClick={() => document.getElementById('image-upload').click()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Upload Image"
          >
            <FaImage className="text-green-500 text-lg sm:text-xl" />
          </button>

          <button
            type="button"
            onClick={() => document.getElementById('video-upload').click()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Upload Video"
          >
            <FaVideo className="text-red-500 text-lg sm:text-xl" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Upload File"
          >
            <FaPaperclip className="text-gray-500 text-lg sm:text-xl" />
          </button>

          {/* Voice Recorder Button */}
          <div className="relative">
            {showVoiceRecorder ? (
              <VoiceRecorder
                conversationId={conversationId}
                receiverId={receiverId}
                onSend={handleVoiceSend}
                onCancel={handleVoiceCancel}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition group relative"
                title="Record voice message"
              >
                <FaMicrophone className="text-purple-500 text-lg sm:text-xl" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Second row - Input and Send Button */}
      <div className="flex gap-2">
        <input
          id="message-input"
          type="text"
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />

        <button
          type="submit"
          disabled={sending || (!messageText.trim() && !uploadingMedia)}
          className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 flex-shrink-0"
        >
          {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={onFileSelect}
      />
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        id="image-upload"
        onChange={onImageSelect}
      />
      <input
        type="file"
        accept="video/*"
        className="hidden"
        id="video-upload"
        onChange={onVideoSelect}
      />

      {/* Emoji Picker */}
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
  );
};

export default ChatFooter;