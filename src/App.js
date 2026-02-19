import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import AnnotationPanel from './components/AnnotationPanel';
import './App.css';

const STORAGE_KEY = "surgical_annotations";

function App() {
  const [annotations, setAnnotations] = useState([]);
  const [currentVideoBasename, setCurrentVideoBasename] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [skipSeconds, setSkipSeconds] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(null);

  // Auto-save to localStorage
  useEffect(() => {
    if (currentVideoBasename && (annotations.length > 0 || hasUnsavedChanges)) {
      try {
        const data = {
          videoBasename: currentVideoBasename,
          annotations: annotations,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        if (hasUnsavedChanges) {
          setHasUnsavedChanges(false);
        }
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, currentVideoBasename]);

  const handleVideoLoad = (basename) => {
    setCurrentVideoBasename(basename);
    loadFromLocalStorage(basename);
  };

  const loadFromLocalStorage = (basename) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.videoBasename === basename && data.annotations) {
          setAnnotations(data.annotations);
          setHasUnsavedChanges(false);
        } else {
          setAnnotations([]);
        }
      } else {
        setAnnotations([]);
      }
    } catch (e) {
      console.error("Load from localStorage failed:", e);
      setAnnotations([]);
    }
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const addAnnotation = (annotation) => {
    setAnnotations([...annotations, annotation]);
    setHasUnsavedChanges(true);
  };

  const deleteAnnotation = (index) => {
    setAnnotations(annotations.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const updateAnnotation = (index, updatedAnnotation) => {
    const newAnnotations = [...annotations];
    newAnnotations[index] = updatedAnnotation;
    setAnnotations(newAnnotations);
    setHasUnsavedChanges(true);
  };

  const loadAnnotations = (loadedAnnotations) => {
    setAnnotations(loadedAnnotations);
    setHasUnsavedChanges(true);
  };

  const clearUnsavedChanges = () => {
    setHasUnsavedChanges(false);
  };

  return (
    <div className="app">
      <VideoPlayer
        ref={videoRef}
        onVideoLoad={handleVideoLoad}
        onTimeUpdate={handleTimeUpdate}
        currentTime={currentTime}
        skipSeconds={skipSeconds}
        setSkipSeconds={setSkipSeconds}
        playbackSpeed={playbackSpeed}
        setPlaybackSpeed={setPlaybackSpeed}
        annotations={annotations}
        showAnnotations={showAnnotations}
        setShowAnnotations={setShowAnnotations}
        onSelectAnnotation={setSelectedAnnotationIndex}
      />
      <AnnotationPanel
        annotations={annotations}
        currentVideoBasename={currentVideoBasename}
        currentTime={currentTime}
        videoRef={videoRef}
        onAddAnnotation={addAnnotation}
        onUpdateAnnotation={updateAnnotation}
        onDeleteAnnotation={deleteAnnotation}
        onLoadAnnotations={loadAnnotations}
        hasUnsavedChanges={hasUnsavedChanges}
        onClearUnsavedChanges={clearUnsavedChanges}
        showAnnotations={showAnnotations}
        setShowAnnotations={setShowAnnotations}
        selectedAnnotationIndex={selectedAnnotationIndex}
        setSelectedAnnotationIndex={setSelectedAnnotationIndex}
      />
    </div>
  );
}

export default App;
