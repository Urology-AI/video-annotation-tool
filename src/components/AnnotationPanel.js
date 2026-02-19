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

  const setStart = () => {
    if (videoRef.current?.video) {
      const time = videoRef.current.getCurrentTime();
      setStartTime(time.toString());
    }
  };

  const setEnd = () => {
    if (videoRef.current?.video) {
      const time = videoRef.current.getCurrentTime();
      setEndTime(time.toString());
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

    if (parseFloat(startTime) >= parseFloat(endTime)) {
      alert("End time must be greater than start time");
      return;
    }

    const newAnnotation = {
      action: action.trim(),
      start: startTime,
      end: endTime,
      comments
    };
    
    onAddAnnotation(newAnnotation);

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
    setEditStartTime(annotation.start);
    setEditEndTime(annotation.end);
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

    if (parseFloat(editStartTime) >= parseFloat(editEndTime)) {
      alert("End time must be greater than start time");
      return;
    }

    onUpdateAnnotation(editingIndex, {
      action: editAction.trim(),
      start: editStartTime,
      end: editEndTime,
      comments: editComments
    });

    cancelEdit();
  };

  const jumpToTime = (time) => {
    if (videoRef.current?.video) {
      videoRef.current.setCurrentTime(parseFloat(time));
    }
  };

  const parseImportText = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const annotations = [];
    let currentAnnotation = null;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;
      
      // Check if line contains "Start:" or "Start"
      const startMatch = trimmed.match(/start\s*:?\s*(\d+\.?\d*)/i);
      if (startMatch) {
        if (!currentAnnotation) {
          currentAnnotation = { action: '', start: '', end: '', comments: '' };
        }
        currentAnnotation.start = startMatch[1];
        continue;
      }
      
      // Check if line contains "End:" or "End"
      const endMatch = trimmed.match(/end\s*:?\s*(\d+\.?\d*)/i);
      if (endMatch) {
        if (!currentAnnotation) {
          currentAnnotation = { action: '', start: '', end: '', comments: '' };
        }
        currentAnnotation.end = endMatch[1];
        
        // If we have action, start, and end, save the annotation
        if (currentAnnotation.action && currentAnnotation.start && currentAnnotation.end) {
          annotations.push({
            action: currentAnnotation.action.trim(),
            start: currentAnnotation.start,
            end: currentAnnotation.end,
            comments: currentAnnotation.comments || ''
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
            start: currentAnnotation.start,
            end: currentAnnotation.end,
            comments: currentAnnotation.comments || ''
          });
        }
        
        // Start new annotation with this line as action
        currentAnnotation = {
          action: trimmed,
          start: '',
          end: '',
          comments: ''
        };
      } else {
        // Add to comments if it's not a time field
        if (!trimmed.match(/^\d+\.?\d*$/)) {
          if (currentAnnotation.comments) {
            currentAnnotation.comments += ' ' + trimmed;
          } else {
            currentAnnotation.comments = trimmed;
          }
        }
      }
    }

    // Add last annotation if complete
    if (currentAnnotation && currentAnnotation.action && currentAnnotation.start && currentAnnotation.end) {
      annotations.push({
        action: currentAnnotation.action.trim(),
        start: currentAnnotation.start,
        end: currentAnnotation.end,
        comments: currentAnnotation.comments || ''
      });
    }

    return annotations;
  };

  const handleImportText = () => {
    if (!importText.trim()) {
      alert("Please enter text to import");
      return;
    }

    const parsedAnnotations = parseImportText(importText);
    
    if (parsedAnnotations.length === 0) {
      alert("No valid annotations found. Please check the format:\n\nAction\nStart: time\nEnd: time");
      return;
    }

    // Add parsed annotations
    parsedAnnotations.forEach(annotation => {
      onAddAnnotation(annotation);
    });

    setImportText('');
    setShowImportText(false);
    alert(`Imported ${parsedAnnotations.length} annotation(s)`);
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
        <label>Start Time (seconds):</label>
        <input
          type="number"
          className="time-input"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          step="0.1"
          min="0"
          placeholder="0.0"
        />
      </div>

      <div className="form-group">
        <label>End Time (seconds):</label>
        <input
          type="number"
          className="time-input"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          step="0.1"
          min="0"
          placeholder="0.0"
        />
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
Start: 10.5
End: 15.2

Or:
peel
Start: 20.0
End: 25.5`}
                      rows={8}
                    />
                    <div className="import-text-actions">
                      <button className="import-btn" onClick={handleImportText}>
                        Import
                      </button>
                      <button className="cancel-import-btn" onClick={() => {
                        setShowImportText(false);
                        setImportText('');
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
                                type="number"
                                className="edit-input time-edit"
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                                step="0.1"
                                min="0"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="edit-input time-edit"
                                value={editEndTime}
                                onChange={(e) => setEditEndTime(e.target.value)}
                                step="0.1"
                                min="0"
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
                              {parseFloat(a.start).toFixed(1)}
                            </td>
                            <td className="time-cell clickable-time" onClick={() => jumpToTime(a.end)} title="Click to jump to time">
                              {parseFloat(a.end).toFixed(1)}
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
    </div>
  );
};

export default AnnotationPanel;
