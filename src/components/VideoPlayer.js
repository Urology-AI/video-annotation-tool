import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState } from 'react';
import { MdEdit } from 'react-icons/md';
import './VideoPlayer.css';

const VideoPlayer = forwardRef(({
  onVideoLoad,
  onTimeUpdate,
  currentTime,
  skipSeconds,
  setSkipSeconds,
  playbackSpeed,
  setPlaybackSpeed,
  annotations = [],
  showAnnotations = true,
  setShowAnnotations,
  onSelectAnnotation
}, ref) => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [videoDuration, setVideoDuration] = useState(1);

  const formatTime = (seconds) => {
    const totalSeconds = parseFloat(seconds);
    if (isNaN(totalSeconds)) return '00:00:00';
    
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const secsInt = Math.floor(secs);
    const hasDecimal = secs % 1 !== 0;
    const secsDecimal = hasDecimal ? (secs % 1).toFixed(1).substring(1) : '';
    
    // Always format as HH:MM:SS or HH:MM:SS.S
    const secsFormatted = hasDecimal
      ? secsInt.toString().padStart(2, '0') + secsDecimal
      : secsInt.toString().padStart(2, '0');
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secsFormatted}`;
  };

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
      setHasVideo(true);
      
      const basename = file.name.replace(/\.[^/.]+$/, "");
      onVideoLoad(basename);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = parseFloat(videoRef.current.currentTime.toFixed(1));
      onTimeUpdate(time);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setVideoDuration(videoRef.current.duration);
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

  const handleLoadVideoClick = () => {
    fileInputRef.current?.click();
  };

  const getActiveAnnotations = () => {
    if (!hasVideo || !showAnnotations || annotations.length === 0) return [];
    return annotations.filter(a => {
      const start = parseFloat(a.start);
      const end = parseFloat(a.end);
      return currentTime >= start && currentTime <= end;
    });
  };

  // Update duration when video metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.duration && !isNaN(video.duration)) {
      setVideoDuration(video.duration);
    }
  }, [hasVideo]);

  const jumpToAnnotation = (startTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = parseFloat(startTime);
    }
  };

  const activeAnnotations = getActiveAnnotations();

  return (
    <div className="video-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          controls
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
        {!hasVideo && (
          <div className="video-overlay">
            <button className="load-video-btn" onClick={handleLoadVideoClick}>
              <span className="icon">📁</span>
              <span className="text">Load Video</span>
            </button>
          </div>
        )}
        
        {hasVideo && showAnnotations && annotations.length > 0 && (
          <div className="annotations-overlay">
            <div className="annotations-timeline">
              {annotations.map((annotation, index) => {
                const start = parseFloat(annotation.start);
                const end = parseFloat(annotation.end);
                // Use video duration if available, otherwise estimate from max end time
                const maxEndTime = Math.max(...annotations.map(a => parseFloat(a.end)), end);
                const duration = videoDuration > 1 ? videoDuration : Math.max(maxEndTime * 1.1, 100);
                const leftPercent = Math.min(Math.max((start / duration) * 100, 0), 100);
                const rightEdge = Math.min(((end / duration) * 100), 100);
                const widthPercent = Math.max(rightEdge - leftPercent, 0.5); // Minimum 0.5% width
                const isActive = currentTime >= start && currentTime <= end;
                
                return (
                  <div
                    key={`annotation-${index}-${start}-${end}`}
                    className={`annotation-marker ${isActive ? 'active' : ''}`}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`
                    }}
                    onClick={() => jumpToAnnotation(start)}
                    title={`${annotation.action}: ${start}s - ${end}s${annotation.comments ? ` - ${annotation.comments}` : ''}`}
                  >
                    {widthPercent > 3 && (
                      <span className="annotation-label">{annotation.action}</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {activeAnnotations.length > 0 && (
              <div className="active-annotations">
                {activeAnnotations.map((annotation, index) => {
                  const annotationIndex = annotations.findIndex(a => 
                    parseFloat(a.start) === parseFloat(annotation.start) && 
                    parseFloat(a.end) === parseFloat(annotation.end) &&
                    a.action === annotation.action
                  );
                  return (
                    <div key={`active-${index}`} className="active-annotation-badge">
                      <span className="badge-action">{annotation.action}</span>
                      {annotation.comments && (
                        <span className="badge-comments">{annotation.comments}</span>
                      )}
                      {onSelectAnnotation && annotationIndex !== -1 && (
                        <span 
                          className="badge-edit-icon"
                          onClick={() => onSelectAnnotation(annotationIndex)}
                          title="Edit annotation"
                        >
                          <MdEdit />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        id="videoFile"
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <div className="controls">
        <div className="control-group">
          <button className="control-btn icon-btn" onClick={handleLoadVideoClick} title="Load Video">
            <span>📁</span>
          </button>
        </div>
        
        <div className="control-group skip-controls">
          <label className="control-label">Skip</label>
          <input
            type="number"
            className="skip-input"
            value={skipSeconds}
            min="0.1"
            step="0.1"
            onChange={(e) => setSkipSeconds(parseFloat(e.target.value) || 1)}
          />
          <button className="control-btn" onClick={skipBackward} title="Skip Backward">
            ⏪
          </button>
          <button className="control-btn" onClick={skipForward} title="Skip Forward">
            ⏩
          </button>
        </div>
        
        <div className="control-group">
          <label className="control-label">Speed</label>
          <select
            className="speed-select"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
          >
            <option value="0.1">0.1x</option>
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
        
        <div className="control-group time-display">
          <span className="time-label">Time</span>
          <span className="time-value">{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
