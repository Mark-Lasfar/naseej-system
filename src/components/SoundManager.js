import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { toast } from 'react-hot-toast';

// Sound Generator Functions
const generateSound = (frequency = 880, duration = 0.3, volume = 0.3) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
    
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    return { audioCtx, oscillator, gainNode };
  } catch (error) {
    console.log('Generate sound error:', error);
    return null;
  }
};

// Sound presets
export const SOUNDS = {
  softBell: () => generateSound(880, 0.4, 0.3),
  gentleTap: () => generateSound(440, 0.1, 0.2),
  classicRing: () => {
    generateSound(660, 0.2, 0.3);
    setTimeout(() => generateSound(880, 0.2, 0.3), 200);
    setTimeout(() => generateSound(660, 0.2, 0.3), 400);
  },
  pop: () => generateSound(220, 0.08, 0.4),
  whatsapp: () => {
    generateSound(800, 0.15, 0.25);
    setTimeout(() => generateSound(600, 0.15, 0.25), 180);
  },
  ding: () => generateSound(1046.5, 0.3, 0.35),
  chime: () => {
    generateSound(523.25, 0.2, 0.3);
    setTimeout(() => generateSound(659.25, 0.2, 0.3), 150);
    setTimeout(() => generateSound(783.99, 0.3, 0.3), 300);
  },
  message: () => {
    generateSound(698.46, 0.12, 0.25);
    setTimeout(() => generateSound(783.99, 0.12, 0.25), 120);
  },
  send: () => {
    generateSound(523.25, 0.08, 0.2);
    setTimeout(() => generateSound(659.25, 0.08, 0.2), 80);
  },
  receive: () => {
    generateSound(659.25, 0.08, 0.25);
    setTimeout(() => generateSound(523.25, 0.08, 0.25), 80);
  },
  recordStart: () => generateSound(440, 0.1, 0.15),
  recordStop: () => generateSound(880, 0.15, 0.2),
  error: () => {
    generateSound(220, 0.2, 0.25);
    setTimeout(() => generateSound(176, 0.3, 0.25), 200);
  }
};

export const soundOptions = [
  { id: 'softBell', name: '🔔 Soft Bell', generator: 'softBell' },
  { id: 'gentleTap', name: '👆 Gentle Tap', generator: 'gentleTap' },
  { id: 'whatsapp', name: '💬 WhatsApp', generator: 'whatsapp' },
  { id: 'classicRing', name: '📞 Classic Ring', generator: 'classicRing' },
  { id: 'pop', name: '🎈 Pop', generator: 'pop' },
  { id: 'chime', name: '✨ Chime', generator: 'chime' },
  { id: 'ding', name: '🔔 Ding', generator: 'ding' },
  { id: 'message', name: '💌 Message', generator: 'message' }
];

// Sound Context
const SoundContext = createContext();

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within SoundProvider');
  }
  return context;
};

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState('softBell');
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem('chatSoundSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setSoundEnabled(settings.soundEnabled ?? true);
      setSelectedSound(settings.selectedSound ?? 'softBell');
      setSoundVolume(settings.soundVolume ?? 0.5);
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem('chatSoundSettings', JSON.stringify({
      soundEnabled,
      selectedSound,
      soundVolume
    }));
  }, [soundEnabled, selectedSound, soundVolume]);

  // Play sound with volume control
  const playSound = useCallback((soundGenerator) => {
    if (!soundEnabled) return;
    
    try {
      // Create gain node for volume control
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const audioCtx = new AudioContext();
      const gainNode = audioCtx.createGain();
      gainNode.connect(audioCtx.destination);
      gainNode.gain.value = soundVolume;
      
      // Wrap the original generator to use volume control
      const originalSound = SOUNDS[soundGenerator];
      if (originalSound) {
        // Override the generateSound temporarily
        const originalGenerate = window.generateSound;
        window.generateSound = (freq, dur, vol) => {
          try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(gainNode);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.value = vol;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + dur);
            osc.stop(audioCtx.currentTime + dur);
          } catch (e) {}
        };
        originalSound();
        window.generateSound = originalGenerate;
      }
      
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
    } catch (error) {
      console.log('Play sound error:', error);
    }
  }, [soundEnabled, soundVolume]);

  // Play notification sound for new message
  const playNotificationSound = useCallback(() => {
    playSound(selectedSound);
  }, [playSound, selectedSound]);

  // Play send sound
  const playSendSound = useCallback(() => {
    playSound('send');
  }, [playSound]);

  // Play receive sound
  const playReceiveSound = useCallback(() => {
    playSound('receive');
  }, [playSound]);

  // Play record start sound
  const playRecordStartSound = useCallback(() => {
    playSound('recordStart');
  }, [playSound]);

  // Play record stop sound
  const playRecordStopSound = useCallback(() => {
    playSound('recordStop');
  }, [playSound]);

  // Play error sound
  const playErrorSound = useCallback(() => {
    playSound('error');
  }, [playSound]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') toast.success('Notifications enabled!');
    }
  }, []);

  // Show desktop notification
  const showNotification = useCallback((title, body, icon) => {
    if (notificationPermission !== 'granted') return;
    
    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/logo192.png',
        silent: !soundEnabled
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.log('Notification error:', error);
    }
  }, [notificationPermission, soundEnabled]);

  // Preview a sound
  const previewSound = useCallback((soundId) => {
    const sound = soundOptions.find(s => s.id === soundId);
    if (sound && SOUNDS[sound.generator]) {
      playSound(sound.generator);
    }
  }, [playSound]);

  const value = {
    soundEnabled,
    setSoundEnabled,
    selectedSound,
    setSelectedSound,
    soundVolume,
    setSoundVolume,
    notificationPermission,
    requestNotificationPermission,
    playNotificationSound,
    playSendSound,
    playReceiveSound,
    playRecordStartSound,
    playRecordStopSound,
    playErrorSound,
    showNotification,
    previewSound,
    soundOptions
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};

export default SoundProvider;