import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import './VideoPlayer.css';

const VideoPlayer = forwardRef(({
  onVideoLoad,
  onTimeUpdate,
  currentTime,
  skipSeconds,
  setSkipSeconds,
  playbackSpeed,
  setPlaybackSpeed
}, ref) => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    video: videoRef.current,
    setCurrentTime: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    getCurrentTime: () => {
      return videoRef.current ? parseFloat(videoRef.current.currentTime.toFixed(1)) : 0;
    }
  }));

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.load();
      
      const basename = file.name.replace(/\.[^/.]+$/, "");
      onVideoLoad(basename);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = parseFloat(videoRef.current.currentTime.toFixed(1));
      onTimeUpdate(time);
    }
  };

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - skipSeconds);
    }
  }, [skipSeconds]);

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration || Infinity;
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + skipSeconds);
    }
  }, [skipSeconds]);

  const handleKeyDown = useCallback((e) => {
    if (e.code === "Space" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "INPUT") {
      e.preventDefault();
      if (videoRef.current) {
        videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
      }
    }
    
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    
    if (e.code === "ArrowLeft") {
      e.preventDefault();
      skipBackward();
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      skipForward();
    }
  }, [skipBackward, skipForward]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        controls
        onTimeUpdate={handleTimeUpdate}
      />
      
      <div className="controls">
        <label htmlFor="videoFile" className="file-btn">
          📁 Load Video
        </label>
        <input
          ref={fileInputRef}
          type="file"
          id="videoFile"
          accept="video/*"
          onChange={handleFileChange}
        />
        
        <div className="skip-controls">
          <label>Skip (sec):</label>
          <input
            type="number"
            id="skipSeconds"
            value={skipSeconds}
            min="0.1"
            step="0.1"
            onChange={(e) => setSkipSeconds(parseFloat(e.target.value) || 1)}
          />
          <button onClick={skipBackward}>← Back</button>
          <button onClick={skipForward}>Forward →</button>
        </div>
        
        <label>
          Speed:
          <select
            id="playbackSpeed"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
          >
            <option value="0.1">0.1x (10 fps)</option>
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1x (Normal)</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </label>
        
        <span id="timeDisplay">Time: {currentTime}s</span>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
