import React, { useState, useEffect, useRef } from 'react';
import { 
    FaPlay, FaPause, FaVolumeUp, FaVolumeDown, FaVolumeMute, 
    FaExpand, FaCompress, FaArrowLeft, FaArrowRight, FaUndo, 
    FaCamera, FaTachometerAlt, FaRegCircle, FaEye, FaEyeSlash,
    FaRedoAlt, FaStepBackward, FaStepForward
} from 'react-icons/fa';

const VideoPlayer = ({ videoUrl, poster, autoPlay = true }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const progressBarRef = useRef(null);
    
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [savedVolume, setSavedVolume] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [previewTime, setPreviewTime] = useState(null);
    const [previewPosition, setPreviewPosition] = useState(0);
    
    let controlsTimeout;

    const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    // Auto-play on mount
    useEffect(() => {
        if (autoPlay && videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setIsPlaying(false);
                });
            }
        }
    }, [autoPlay]);

    // Video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (!isDragging) {
                const percent = (video.currentTime / video.duration) * 100;
                setProgress(percent);
                setCurrentTime(video.currentTime);
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const handleWaiting = () => setIsBuffering(true);
        const handlePlaying = () => setIsBuffering(false);
        
        const handleEnded = () => {
            setIsPlaying(false);
            if (isLooping) {
                video.currentTime = 0;
                video.play();
            }
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [isLooping, isDragging]);

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!containerRef.current?.contains(document.activeElement) && !isFullscreen) return;
            
            switch(e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    skipBackward();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    skipForward();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    changeVolume(0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    changeVolume(-0.1);
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'l':
                    e.preventDefault();
                    setIsLooping(!isLooping);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPlaying, isFullscreen, isLooping]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (isMuted) {
            video.muted = false;
            video.volume = savedVolume;
            setVolume(savedVolume);
            setIsMuted(false);
        } else {
            setSavedVolume(volume);
            video.muted = true;
            setIsMuted(true);
        }
    };

    const changeVolume = (delta) => {
        const video = videoRef.current;
        let newVolume = volume + delta;
        newVolume = Math.min(Math.max(newVolume, 0), 1);
        video.volume = newVolume;
        setVolume(newVolume);
        if (newVolume === 0) {
            video.muted = true;
            setIsMuted(true);
        } else {
            video.muted = false;
            setIsMuted(false);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        const video = videoRef.current;
        video.volume = newVolume;
        setVolume(newVolume);
        if (newVolume === 0) {
            video.muted = true;
            setIsMuted(true);
        } else {
            video.muted = false;
            setIsMuted(false);
            setSavedVolume(newVolume);
        }
    };

    const handleProgressMouseMove = (e) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = (x / width) * 100;
        const time = (percentage / 100) * duration;
        setPreviewTime(time);
        setPreviewPosition(percentage);
    };

    const handleProgressMouseLeave = () => {
        setPreviewTime(null);
        setPreviewPosition(0);
    };

    const handleProgressClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = (x / width) * 100;
        const newTime = (percentage / 100) * duration;
        videoRef.current.currentTime = newTime;
        setProgress(percentage);
        setCurrentTime(newTime);
    };

    const handleProgressMouseDown = (e) => {
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = (x / width) * 100;
        const newTime = (percentage / 100) * duration;
        videoRef.current.currentTime = newTime;
        setProgress(percentage);
        setCurrentTime(newTime);
        
        const handleMouseMove = (moveEvent) => {
            if (!isDragging) return;
            const moveRect = progressBarRef.current.getBoundingClientRect();
            let moveX = moveEvent.clientX - moveRect.left;
            moveX = Math.min(Math.max(moveX, 0), moveRect.width);
            const movePercentage = (moveX / moveRect.width) * 100;
            const moveNewTime = (movePercentage / 100) * duration;
            videoRef.current.currentTime = moveNewTime;
            setProgress(movePercentage);
            setCurrentTime(moveNewTime);
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const skipForward = () => {
        const video = videoRef.current;
        video.currentTime = Math.min(video.currentTime + 10, duration);
        showTempMessage('+10 seconds');
    };

    const skipBackward = () => {
        const video = videoRef.current;
        video.currentTime = Math.max(video.currentTime - 10, 0);
        showTempMessage('-10 seconds');
    };

    const handleSpeedChange = (speed) => {
        videoRef.current.playbackRate = speed;
        setPlaybackRate(speed);
        setShowSpeedMenu(false);
        showTempMessage(`${speed}x speed`);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        
        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleScreenshot = () => {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `screenshot-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            showTempMessage('Screenshot saved');
        });
    };

    const handleReplay = () => {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        showTempMessage('Replaying');
    };

    const showTempMessage = (message) => {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = message;
        tempDiv.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-50 pointer-events-none whitespace-nowrap';
        document.body.appendChild(tempDiv);
        setTimeout(() => tempDiv.remove(), 1000);
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMouseEnter = () => {
        clearTimeout(controlsTimeout);
        setShowControls(true);
    };

    const handleMouseLeave = () => {
        if (isPlaying) {
            controlsTimeout = setTimeout(() => {
                setShowControls(false);
            }, 2000);
        }
    };

    const handleDoubleClick = () => {
        toggleFullscreen();
    };

    const handleVideoClick = () => {
        togglePlay();
    };

    return (
        <div
            ref={containerRef}
            className="relative group bg-black rounded-lg overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
        >
            <video
                ref={videoRef}
                src={videoUrl}
                poster={poster}
                className="w-full max-h-[500px] object-contain cursor-pointer"
                onClick={handleVideoClick}
                playsInline
                loop={isLooping}
            />
            
            {/* Loading/Buffering Indicator */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                </div>
            )}
            
            {/* Video Controls Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <span className="text-white text-xs bg-black/50 px-2 py-1 rounded font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        {playbackRate !== 1 && (
                            <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                                {playbackRate}x
                            </span>
                        )}
                        {isLooping && (
                            <span className="text-white text-xs bg-blue-500/80 px-2 py-1 rounded flex items-center gap-1">
                                <FaRedoAlt size={10} /> Loop
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleScreenshot}
                            className="text-white hover:text-blue-400 transition p-1 bg-black/50 rounded"
                            title="Take Screenshot"
                        >
                            <FaCamera size={16} />
                        </button>
                    </div>
                </div>
                
                {/* Center Controls */}
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                    <button
                        onClick={skipBackward}
                        className="bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition hover:scale-110"
                        title="Back 10 seconds"
                    >
                        <FaStepBackward size={20} />
                    </button>
                    
                    <button
                        onClick={togglePlay}
                        className="bg-black/60 text-white rounded-full p-5 hover:bg-black/80 transition hover:scale-110"
                    >
                        {isPlaying ? <FaPause size={32} /> : <FaPlay size={32} className="ml-1" />}
                    </button>
                    
                    <button
                        onClick={skipForward}
                        className="bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition hover:scale-110"
                        title="Forward 10 seconds"
                    >
                        <FaStepForward size={20} />
                    </button>
                </div>
                
                {/* Replay Button */}
                {!isPlaying && progress >= 99 && duration > 0 && (
                    <button
                        onClick={handleReplay}
                        className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition hover:scale-110"
                    >
                        <FaUndo size={20} />
                    </button>
                )}
                
                {/* Bottom Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                    {/* Progress Bar with Preview */}
                    <div className="relative">
                        {/* Preview Tooltip */}
                        {previewTime !== null && (
                            <div 
                                className="absolute bottom-6 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono whitespace-nowrap"
                                style={{ left: `${previewPosition}%` }}
                            >
                                {formatTime(previewTime)}
                            </div>
                        )}
                        
                        <div 
                            ref={progressBarRef}
                            className="flex-1 h-1.5 bg-white/30 rounded-full cursor-pointer group/progress"
                            onClick={handleProgressClick}
                            onMouseMove={handleProgressMouseMove}
                            onMouseLeave={handleProgressMouseLeave}
                            onMouseDown={handleProgressMouseDown}
                        >
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative" style={{ width: `${progress}%` }}>
                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition shadow-lg"></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Play/Pause */}
                            <button onClick={togglePlay} className="text-white hover:text-blue-400 transition" title="Play/Pause (Space/K)">
                                {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
                            </button>
                            
                            {/* Volume Control */}
                            <div 
                                className="relative"
                                onMouseEnter={() => setShowVolumeSlider(true)}
                                onMouseLeave={() => setShowVolumeSlider(false)}
                            >
                                <button onClick={toggleMute} className="text-white hover:text-blue-400 transition" title="Mute (M)">
                                    {isMuted ? <FaVolumeMute size={18} /> : volume > 0.5 ? <FaVolumeUp size={18} /> : <FaVolumeDown size={18} />}
                                </button>
                                {showVolumeSlider && (
                                    <div className="absolute bottom-full left-0 mb-2 w-24 bg-black/90 rounded-lg p-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={isMuted ? 0 : volume}
                                            onChange={handleVolumeChange}
                                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* Skip Buttons */}
                            <button onClick={skipBackward} className="text-white hover:text-blue-400 transition text-sm flex items-center gap-1" title="Back 10 seconds (←)">
                                <FaArrowLeft size={12} /> 10
                            </button>
                            <button onClick={skipForward} className="text-white hover:text-blue-400 transition text-sm flex items-center gap-1" title="Forward 10 seconds (→)">
                                10 <FaArrowRight size={12} />
                            </button>
                            
                            {/* Loop */}
                            <button 
                                onClick={() => setIsLooping(!isLooping)} 
                                className={`transition ${isLooping ? 'text-blue-400' : 'text-white hover:text-blue-400'}`}
                                title="Loop (L)"
                            >
                                <FaRedoAlt size={16} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* Playback Speed */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                    className="text-white hover:text-blue-400 transition text-sm px-2 py-1 rounded bg-white/10 flex items-center gap-1"
                                    title="Playback Speed"
                                >
                                    <FaTachometerAlt size={12} /> {playbackRate}x
                                </button>
                                {showSpeedMenu && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-1 z-20 min-w-[100px]">
                                        {speedOptions.map(speed => (
                                            <button
                                                key={speed}
                                                onClick={() => handleSpeedChange(speed)}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                                                    playbackRate === speed ? 'bg-blue-600 text-white' : 'text-white hover:bg-white/20'
                                                }`}
                                            >
                                                {speed}x {speed === 1 && '✓'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Fullscreen */}
                            <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition" title="Fullscreen (F)">
                                {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Keyboard shortcuts hint */}
            {showControls && (
                <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    ⌨️ Space/K: Play/Pause | ←/→: Skip ±10s | F: Fullscreen | M: Mute | L: Loop
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;