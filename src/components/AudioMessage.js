// src/components/AudioMessage.js
import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaSpinner } from 'react-icons/fa';

const AudioMessage = ({ src, duration: propDuration }) => {
  // ✅ التحقق من وجود src أولاً (قبل الـ hooks)
  if (!src) {
    return <div className="text-gray-400 text-sm bg-gray-100 rounded-lg p-3">🎤 Voice message (loading...)</div>;
  }

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration || 0);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gray-100 rounded-lg p-3 min-w-[200px] max-w-[280px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition"
        >
          {loading ? (
            <FaSpinner className="animate-spin" size={14} />
          ) : isPlaying ? (
            <FaPause size={14} />
          ) : (
            <FaPlay size={14} className="ml-0.5" />
          )}
        </button>
        
        <div className="flex-1">
          <div className="relative h-1 bg-gray-300 rounded-full cursor-pointer" onClick={handleSeek}>
            <div 
              className="absolute h-full bg-blue-500 rounded-full" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="text-lg">🎤</div>
      </div>
    </div>
  );
};

export default AudioMessage;