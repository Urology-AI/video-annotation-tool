import React, { useState, useRef, useEffect } from 'react';
import './AnnotationPanel.css';

const AnnotationPanel = ({
  annotations,
  currentVideoBasename,
  currentTime,
  videoRef,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onLoadAnnotations,
  hasUnsavedChanges,
  onClearUnsavedChanges,
  showAnnotations,
  setShowAnnotations
}) => {
  const [action, setAction] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comments, setComments] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showAnnotationsPanel, setShowAnnotationsPanel] = useState(false);
  const [showImportText, setShowImportText] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [previewAnnotations, setPreviewAnnotations] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editAction, setEditAction] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editComments, setEditComments] = useState('');
  const fileInputRef = useRef(null);
  const actionInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const actionOptions = ['peel', 'cold cut', 'hot cut', 'spread', 'cauterize', 'dissect', 'suture', 'grasp', 'other'];

  // Filter suggestions based on input
  useEffect(() => {
    if (action.trim() === '') {
      setFilteredSuggestions(actionOptions);
    } else {
      const filtered = actionOptions.filter(opt => 
        opt.toLowerCase().includes(action.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionInputRef.current &&
        !actionInputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionChange = (e) => {
    setAction(e.target.value);
    setShowSuggestions(true);
  };

  const handleActionFocus = () => {
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setAction(suggestion);
    setShowSuggestions(false);
    actionInputRef.current?.focus();
  };

  const handleActionKeyDown = (e) => {
    if (e.key === 'ArrowDown' && filteredSuggestions.length > 0) {
      e.preventDefault();
      setShowSuggestions(true);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const formatTimeForDisplay = (seconds) => {
    const totalSeconds = parseFloat(seconds);
    if (isNaN(totalSeconds)) return seconds;
    
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = (totalSeconds % 60).toFixed(1);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
    } else if (mins > 0) {
      return `${mins}:${secs.padStart(4, '0')}`;
    }
    return secs;
  };

  const setStart = () => {
    if (videoRef.current?.video) {
      const time = videoRef.current.getCurrentTime();
      setStartTime(formatTimeForDisplay(time));
    }
  };

  const setEnd = () => {
    if (videoRef.current?.video) {
      const time = videoRef.current.getCurrentTime();
      setEndTime(formatTimeForDisplay(time));
    }
  };

  const handleAddAnnotation = () => {
    if (!action.trim()) {
      alert("Please enter an action type");
      return;
    }

    if (startTime === "" || endTime === "") {
      alert("Please set both Start and End times");
      return;
    }

    // Convert times to seconds if needed
    const startSeconds = parseTimeToSeconds(startTime);
    const endSeconds = parseTimeToSeconds(endTime);

    if (startSeconds === null || endSeconds === null) {
      alert("Invalid time format. Use HH:MM:SS (1:30:45), HH:MM (1:30), MM:SS (30:45), or seconds (90.5)");
      return;
    }

    if (parseFloat(startSeconds) >= parseFloat(endSeconds)) {
      alert("End time must be greater than start time");
      return;
    }

    const newAnnotation = {
      action: action.trim(),
      start: startSeconds,
      end: endSeconds,
      comments
    };
    
    onAddAnnotation(newAnnotation);

    setStartTime("");
    setEndTime("");
    setComments("");
    setShowSuggestions(false);
    
    // Scroll to bottom of annotations table to show new annotation
    setTimeout(() => {
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        tableContainer.scrollTop = tableContainer.scrollHeight;
      }
    }, 100);
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result.map(s => s.trim().replace(/^"|"$/g, ''));
  };

  const loadCSV = (file) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const csv = event.target.result;
      const lines = csv.split('\n');
      
      const loadedAnnotations = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "") continue;
        
        const parts = parseCSVLine(line);
        if (parts.length >= 3) {
          loadedAnnotations.push({
            action: parts[0],
            start: parts[1],
            end: parts[2],
            comments: parts[3] || ""
          });
        }
      }
      
      onLoadAnnotations(loadedAnnotations);
      alert(`Loaded ${loadedAnnotations.length} annotations from CSV`);
    };
    reader.readAsText(file);
  };

  const loadJSON = (file) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const data = JSON.parse(event.target.result);
        if (data.annotations && Array.isArray(data.annotations)) {
          onLoadAnnotations(data.annotations);
          alert(`Loaded ${data.annotations.length} annotations from JSON`);
        } else {
          alert("Invalid JSON format");
        }
      } catch (e) {
        alert("Error loading JSON file: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'csv') {
        loadCSV(file);
      } else if (ext === 'json') {
        loadJSON(file);
      }
    }
    e.target.value = "";
  };

  const loadAnnotations = () => {
    fileInputRef.current?.click();
  };

  const escapeCSV = (str) => {
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const downloadCSV = () => {
    let csv = "action,start_time,end_time,comments\n";
    annotations.forEach(a => {
      csv += `${escapeCSV(a.action)},${a.start},${a.end},${escapeCSV(a.comments)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const filename = currentVideoBasename ? `${currentVideoBasename}.csv` : "annotations.csv";
    link.download = filename;
    link.click();
  };

  const saveAnnotations = () => {
    const data = {
      videoBasename: currentVideoBasename,
      annotations: annotations,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const filename = currentVideoBasename ? `${currentVideoBasename}_annotations.json` : "annotations.json";
    link.download = filename;
    link.click();
    
    onClearUnsavedChanges();
  };

  const getActionClass = (action) => {
    const normalized = action.toLowerCase().replace(/\s+/g, '-');
    // Check if it matches a known action, otherwise use 'other'
    const knownActions = ['peel', 'cold-cut', 'hot-cut', 'spread', 'cauterize', 'dissect', 'suture', 'grasp', 'other'];
    return knownActions.includes(normalized) ? normalized : 'other';
  };

  const startEdit = (index) => {
    const annotation = annotations[index];
    setEditingIndex(index);
    setEditAction(annotation.action);
    setEditStartTime(formatTimeForDisplay(annotation.start));
    setEditEndTime(formatTimeForDisplay(annotation.end));
    setEditComments(annotation.comments);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditAction('');
    setEditStartTime('');
    setEditEndTime('');
    setEditComments('');
  };

  const saveEdit = () => {
    if (!editAction.trim() || !editStartTime || !editEndTime) {
      alert("Please fill in all required fields");
      return;
    }

    // Convert times to seconds if needed
    const startSeconds = parseTimeToSeconds(editStartTime);
    const endSeconds = parseTimeToSeconds(editEndTime);

    if (startSeconds === null || endSeconds === null) {
      alert("Invalid time format. Use HH:MM:SS (1:30:45), HH:MM (1:30), MM:SS (30:45), or seconds (90.5)");
      return;
    }

    if (parseFloat(startSeconds) >= parseFloat(endSeconds)) {
      alert("End time must be greater than start time");
      return;
    }

    onUpdateAnnotation(editingIndex, {
      action: editAction.trim(),
      start: startSeconds,
      end: endSeconds,
      comments: editComments
    });

    cancelEdit();
  };

  const jumpToTime = (time) => {
    if (videoRef.current?.video) {
      videoRef.current.setCurrentTime(parseFloat(time));
    }
  };

  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return null;
    
    const trimmed = timeStr.trim();
    
    // Handle HH:MM:SS format (e.g., "1:30:45" or "01:30:45")
    const hhmmssMatch = trimmed.match(/^(\d+):(\d+):(\d+\.?\d*)$/);
    if (hhmmssMatch) {
      const hours = parseFloat(hhmmssMatch[1]);
      const minutes = parseFloat(hhmmssMatch[2]);
      const seconds = parseFloat(hhmmssMatch[3]);
      return (hours * 3600 + minutes * 60 + seconds).toFixed(1);
    }
    
    // Handle HH:MM format (e.g., "1:30" - if first number > 23, treat as MM:SS)
    const hhmmMatch = trimmed.match(/^(\d+):(\d+\.?\d*)$/);
    if (hhmmMatch) {
      const first = parseFloat(hhmmMatch[1]);
      const second = parseFloat(hhmmMatch[2]);
      
      // If first number is > 23, treat as MM:SS (minutes:seconds)
      if (first > 23) {
        return (first * 60 + second).toFixed(1);
      }
      // Otherwise treat as HH:MM (hours:minutes)
      return (first * 3600 + second * 60).toFixed(1);
    }
    
    // Handle SS format (e.g., "90.5")
    const secondsMatch = trimmed.match(/^(\d+\.?\d*)$/);
    if (secondsMatch) {
      return parseFloat(secondsMatch[1]).toFixed(1);
    }
    
    return null;
  };

  const parseImportText = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    const annotations = [];
    let currentAnnotation = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line contains "Start:" or "Start" - supports HH:MM:SS, HH:MM, MM:SS, or seconds
      const startMatch = line.match(/start\s*:?\s*([\d:\.]+)/i);
      if (startMatch) {
        if (!currentAnnotation) {
          currentAnnotation = { action: '', start: '', end: '', comments: '' };
        }
        const timeInSeconds = parseTimeToSeconds(startMatch[1]);
        if (timeInSeconds !== null) {
          currentAnnotation.start = timeInSeconds;
        }
        continue;
      }
      
      // Check if line contains "End:" or "End" - supports HH:MM:SS, HH:MM, MM:SS, or seconds
      const endMatch = line.match(/end\s*:?\s*([\d:\.]+)/i);
      if (endMatch) {
        if (!currentAnnotation) {
          currentAnnotation = { action: '', start: '', end: '', comments: '' };
        }
        const timeInSeconds = parseTimeToSeconds(endMatch[1]);
        if (timeInSeconds !== null) {
          currentAnnotation.end = timeInSeconds;
        }
        
        // If we have action, start, and end, save the annotation
        if (currentAnnotation.action && currentAnnotation.start && currentAnnotation.end) {
          annotations.push({
            action: currentAnnotation.action.trim(),
            start: currentAnnotation.start.toString(),
            end: currentAnnotation.end.toString(),
            comments: (currentAnnotation.comments || '').trim()
          });
          currentAnnotation = null;
        }
        continue;
      }
      
      // If no current annotation or action is missing, treat line as action
      if (!currentAnnotation || !currentAnnotation.action) {
        // Save previous annotation if complete
        if (currentAnnotation && currentAnnotation.action && currentAnnotation.start && currentAnnotation.end) {
          annotations.push({
            action: currentAnnotation.action.trim(),
            start: currentAnnotation.start.toString(),
            end: currentAnnotation.end.toString(),
            comments: (currentAnnotation.comments || '').trim()
          });
        }
        
        // Start new annotation with this line as action
        currentAnnotation = {
          action: line,
          start: '',
          end: '',
          comments: ''
        };
      } else {
        // Add to comments if it's not a time field
        if (!line.match(/^\d+\.?\d*$/)) {
          if (currentAnnotation.comments) {
            currentAnnotation.comments += ' ' + line;
          } else {
            currentAnnotation.comments = line;
          }
        }
      }
    }

    // Add last annotation if complete
    if (currentAnnotation && currentAnnotation.action && currentAnnotation.start && currentAnnotation.end) {
      annotations.push({
        action: currentAnnotation.action.trim(),
        start: currentAnnotation.start.toString(),
        end: currentAnnotation.end.toString(),
        comments: (currentAnnotation.comments || '').trim()
      });
    }

    return annotations;
  };

  const validateAnnotation = (ann) => {
    const errors = [];
    if (!ann.action || !ann.action.trim()) {
      errors.push("Missing action");
    }
    if (!ann.start) {
      errors.push("Missing start time");
    } else {
      const startSeconds = parseTimeToSeconds(ann.start);
      if (startSeconds === null) {
        errors.push("Invalid start time format");
      } else {
        ann.startSeconds = startSeconds;
      }
    }
    if (!ann.end) {
      errors.push("Missing end time");
    } else {
      const endSeconds = parseTimeToSeconds(ann.end);
      if (endSeconds === null) {
        errors.push("Invalid end time format");
      } else {
        ann.endSeconds = endSeconds;
      }
    }
    if (ann.startSeconds !== undefined && ann.endSeconds !== undefined) {
      if (parseFloat(ann.startSeconds) >= parseFloat(ann.endSeconds)) {
        errors.push("End time must be greater than start time");
      }
    }
    ann.errors = errors;
    ann.isValid = errors.length === 0;
    return ann;
  };

  const handleParseImport = () => {
    if (!importText.trim()) {
      alert("Please enter text to import");
      return;
    }

    const parsedAnnotations = parseImportText(importText);
    
    if (parsedAnnotations.length === 0) {
      alert("No annotations found. Please check the format:\n\nAction\nStart: time\nEnd: time");
      return;
    }

    // Validate all annotations
    const validatedAnnotations = parsedAnnotations.map(ann => validateAnnotation(ann));
    setPreviewAnnotations(validatedAnnotations);
    setShowImportPreview(true);
  };

  const handleConfirmImport = () => {
    const validAnnotations = previewAnnotations
      .filter(ann => ann.isValid)
      .map(ann => ({
        action: ann.action.trim(),
        start: ann.startSeconds.toString(),
        end: ann.endSeconds.toString(),
        comments: (ann.comments || '').trim()
      }));

    if (validAnnotations.length === 0) {
      alert("No valid annotations to import. Please fix the errors.");
      return;
    }

    // Add valid annotations
    onLoadAnnotations([...annotations, ...validAnnotations]);

    setImportText('');
    setShowImportText(false);
    setShowImportPreview(false);
    setPreviewAnnotations([]);
    alert(`Imported ${validAnnotations.length} annotation(s) successfully`);
  };

  const handleCancelPreview = () => {
    setShowImportPreview(false);
    setPreviewAnnotations([]);
  };

  const handleFixPreviewAnnotation = (index, field, value) => {
    const updated = [...previewAnnotations];
    updated[index] = { ...updated[index], [field]: value };
    const validated = validateAnnotation(updated[index]);
    updated[index] = validated;
    setPreviewAnnotations(updated);
  };

  return (
    <div className="panel">
      <h3>📋 Surgical Annotation</h3>

      <div className="panel-form-section">
      <div className="form-group">
        <label>Action Type:</label>
        <div className="autocomplete-container">
          <input
            ref={actionInputRef}
            type="text"
            value={action}
            onChange={handleActionChange}
            onFocus={handleActionFocus}
            onKeyDown={handleActionKeyDown}
            placeholder="Type an action (e.g., peel, cut, spread)..."
            className="action-input"
            autoComplete="off"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div ref={suggestionsRef} className="suggestions-list">
              {filteredSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Start Time:</label>
        <input
          type="text"
          className="time-input"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          placeholder="1:30:45 or 1:30 or 90.5"
        />
        <small className="time-hint">Format: HH:MM:SS (1:30:45), HH:MM (1:30), MM:SS (30:45), or seconds (90.5)</small>
      </div>

      <div className="form-group">
        <label>End Time:</label>
        <input
          type="text"
          className="time-input"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          placeholder="2:15:30 or 2:15 or 135.0"
        />
        <small className="time-hint">Format: HH:MM:SS (2:15:30), HH:MM (2:15), MM:SS (15:30), or seconds (135.0)</small>
      </div>

      <div className="form-group">
        <label>Comments:</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add notes or observations about this surgical action..."
        />
      </div>

      <div className="button-group">
        <button onClick={handleAddAnnotation}>➕ Add Annotation</button>
      </div>

      <div className="button-group">
        <button onClick={setStart}>Set Start</button>
        <button onClick={setEnd}>Set End</button>
      </div>

      <div className="save-status">
        <span className={`status-indicator ${hasUnsavedChanges ? 'status-unsaved' : 'status-saved'}`}></span>
        {hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
      </div>
      </div>

      {!showAnnotationsPanel && (
        <div className="bottom-actions">
          <button 
            className="view-annotations-btn"
            onClick={() => setShowAnnotationsPanel(true)}
            title="View All Annotations"
          >
            <span>📋</span>
            <span>View Annotations ({annotations.length})</span>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {showAnnotationsPanel && (
        <div className="annotations-panel-overlay" onClick={() => setShowAnnotationsPanel(false)}>
          <div className="annotations-panel-content" onClick={(e) => e.stopPropagation()}>
            <div className="annotations-panel-header">
              <h3>📋 Annotations ({annotations.length})</h3>
              <button className="close-panel-btn" onClick={() => setShowAnnotationsPanel(false)}>
                ✕
              </button>
            </div>
            
            <div className="annotations-panel-actions">
              <div className="view-annotations-toggle">
                <button 
                  className={`toggle-btn ${showAnnotations ? 'active' : ''}`}
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  title={showAnnotations ? "Hide Annotations on Video" : "Show Annotations on Video"}
                >
                  <span>{showAnnotations ? '👁️' : '👁️‍🗨️'}</span>
                  <span>Show on Video</span>
                </button>
              </div>
              
              <div className="import-text-section">
                <button 
                  className="import-text-btn"
                  onClick={() => setShowImportText(!showImportText)}
                >
                  {showImportText ? '✕' : '📝'} Import Text
                </button>
                {showImportText && (
                  <div className="import-text-box">
                    <textarea
                      className="import-textarea"
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder={`Enter annotations in format:
Action name
Start: 1:30:45
End: 2:15:30

Or:
peel
Start: 1:30
End: 2:15

Or:
cut
Start: 90.5
End: 135.0

Supports HH:MM:SS, HH:MM, MM:SS, or seconds`}
                      rows={8}
                    />
                    <div className="import-text-actions">
                      <button className="parse-btn" onClick={handleParseImport}>
                        Preview & Validate
                      </button>
                      <button className="cancel-import-btn" onClick={() => {
                        setShowImportText(false);
                        setImportText('');
                        setShowImportPreview(false);
                        setPreviewAnnotations([]);
                      }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="save-load-group">
                <button className="save-btn" onClick={saveAnnotations}>💾 Save</button>
                <button className="load-btn" onClick={loadAnnotations}>📂 Load</button>
                <button onClick={downloadCSV}>📥 Export CSV</button>
              </div>
            </div>

            <div className="annotations-panel-table">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Start (s)</th>
                      <th>End (s)</th>
                      <th>Comments</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annotations.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          No annotations yet. Add your first annotation above.
                        </td>
                      </tr>
                    ) : (
                      annotations.map((a, index) => (
                        editingIndex === index ? (
                          <tr key={index} className="editing-row">
                            <td>
                              <input
                                type="text"
                                className="edit-input"
                                value={editAction}
                                onChange={(e) => setEditAction(e.target.value)}
                                placeholder="Action"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="edit-input time-edit"
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                                placeholder="1:30:45 or 90.5"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="edit-input time-edit"
                                value={editEndTime}
                                onChange={(e) => setEditEndTime(e.target.value)}
                                placeholder="2:15:30 or 135.0"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="edit-input"
                                value={editComments}
                                onChange={(e) => setEditComments(e.target.value)}
                                placeholder="Comments"
                              />
                            </td>
                            <td>
                              <div className="edit-actions">
                                <button className="save-edit-btn" onClick={saveEdit} title="Save">
                                  ✓
                                </button>
                                <button className="cancel-edit-btn" onClick={cancelEdit} title="Cancel">
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={index}>
                            <td>
                              <span className={`action-badge action-${getActionClass(a.action)}`}>
                                {a.action}
                              </span>
                            </td>
                            <td className="time-cell clickable-time" onClick={() => jumpToTime(a.start)} title="Click to jump to time">
                              {formatTimeForDisplay(a.start)}
                            </td>
                            <td className="time-cell clickable-time" onClick={() => jumpToTime(a.end)} title="Click to jump to time">
                              {formatTimeForDisplay(a.end)}
                            </td>
                            <td className="comments-cell">
                              <div className="comments-content" title={a.comments || 'No comments'}>
                                {a.comments || '-'}
                              </div>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button className="edit-btn" onClick={() => startEdit(index)} title="Edit">
                                  ✏️
                                </button>
                                <button className="delete-btn" onClick={() => onDeleteAnnotation(index)} title="Delete">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportPreview && (
        <div className="import-preview-overlay" onClick={handleCancelPreview}>
          <div className="import-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="import-preview-header">
              <h3>📋 Import Preview</h3>
              <button className="close-preview-btn" onClick={handleCancelPreview}>
                ✕
              </button>
            </div>
            
            <div className="import-preview-info">
              <p>
                Found <strong>{previewAnnotations.length}</strong> annotation(s). 
                <span className={previewAnnotations.filter(a => a.isValid).length === previewAnnotations.length ? 'all-valid' : 'has-errors'}>
                  {' '}{previewAnnotations.filter(a => a.isValid).length} valid, {previewAnnotations.filter(a => !a.isValid).length} with errors
                </span>
              </p>
            </div>

            <div className="import-preview-table-container">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Action</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {previewAnnotations.map((ann, index) => (
                    <tr key={index} className={ann.isValid ? 'preview-valid' : 'preview-invalid'}>
                      <td>
                        {ann.isValid ? (
                          <span className="status-valid">✓</span>
                        ) : (
                          <span className="status-invalid" title={ann.errors.join(', ')}>✗</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          className="preview-edit-input"
                          value={ann.action || ''}
                          onChange={(e) => handleFixPreviewAnnotation(index, 'action', e.target.value)}
                          placeholder="Action"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="preview-edit-input"
                          value={ann.start || ''}
                          onChange={(e) => handleFixPreviewAnnotation(index, 'start', e.target.value)}
                          placeholder="1:30:45"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="preview-edit-input"
                          value={ann.end || ''}
                          onChange={(e) => handleFixPreviewAnnotation(index, 'end', e.target.value)}
                          placeholder="2:15:30"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="preview-edit-input"
                          value={ann.comments || ''}
                          onChange={(e) => handleFixPreviewAnnotation(index, 'comments', e.target.value)}
                          placeholder="Comments"
                        />
                        {ann.errors.length > 0 && (
                          <div className="preview-errors">
                            {ann.errors.map((error, i) => (
                              <span key={i} className="error-badge">{error}</span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="import-preview-actions">
              <button className="remove-invalid-btn" onClick={() => {
                setPreviewAnnotations(previewAnnotations.filter(a => a.isValid));
              }}>
                Remove Invalid ({previewAnnotations.filter(a => !a.isValid).length})
              </button>
              <div className="preview-action-buttons">
                <button className="cancel-preview-btn" onClick={handleCancelPreview}>
                  Cancel
                </button>
                <button 
                  className="confirm-import-btn" 
                  onClick={handleConfirmImport}
                  disabled={previewAnnotations.filter(a => a.isValid).length === 0}
                >
                  Import {previewAnnotations.filter(a => a.isValid).length} Valid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationPanel;
