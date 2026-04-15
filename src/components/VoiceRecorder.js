import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaSpinner, FaTrash, FaCheck, FaMicrophoneSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://mgzon-naseej-backend.hf.space/api';

const VoiceRecorder = ({ onSend, onCancel, conversationId, receiverId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermissionDenied(true);
      toast.error('Microphone access denied. Please check your permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    onCancel();
  };

  // Send audio message
  const sendAudioMessage = async () => {
    if (!audioBlob) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-message.webm');
    
    try {
      // Upload audio file
      const uploadResponse = await axios.post(`${API_URL}/upload/audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Send message with audio URL
      await axios.post(`${API_URL}/chat/messages`, {
        conversationId,
        receiverId,
        text: '🎤 Voice message',
        type: 'audio',
        mediaUrl: uploadResponse.data.url,
        duration: recordingTime
      });
      
      toast.success('Voice message sent');
      onSend();
      
      // Cleanup
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  // If permission denied, show button to request again
  if (permissionDenied) {
    return (
      <button
        onClick={() => {
          setPermissionDenied(false);
          startRecording();
        }}
        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
        title="Request Microphone Access"
      >
        <FaMicrophoneSlash size={18} />
      </button>
    );
  }

  // Show recording UI
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-red-500">Recording</span>
        </div>
        <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
        <button
          onClick={stopRecording}
          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
          title="Stop recording"
        >
          <FaStop size={12} />
        </button>
      </div>
    );
  }

  // Show preview after recording
  if (audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
        <audio src={audioUrl} controls className="h-8 w-32" />
        <span className="text-xs text-gray-500">{formatTime(recordingTime)}</span>
        <button
          onClick={sendAudioMessage}
          disabled={uploading}
          className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition disabled:opacity-50"
          title="Send voice message"
        >
          {uploading ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
        </button>
        <button
          onClick={cancelRecording}
          className="p-1 bg-gray-400 text-white rounded-full hover:bg-gray-500 transition"
          title="Cancel"
        >
          <FaTrash size={12} />
        </button>
      </div>
    );
  }

  // Default button
  return (
    <button
      onClick={startRecording}
      className="p-2 hover:bg-gray-100 rounded-full transition relative group"
      title="Record voice message"
    >
      <FaMicrophone className="text-purple-500 text-lg sm:text-xl" />
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
        Press and hold to record
      </span>
    </button>
  );
};

export default VoiceRecorder;