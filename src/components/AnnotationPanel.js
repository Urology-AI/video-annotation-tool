import React, { useState, useRef } from 'react';
import './AnnotationPanel.css';

const AnnotationPanel = ({
  annotations,
  currentVideoBasename,
  currentTime,
  videoRef,
  onAddAnnotation,
  onDeleteAnnotation,
  onLoadAnnotations,
  hasUnsavedChanges,
  onClearUnsavedChanges
}) => {
  const [action, setAction] = useState('peel');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comments, setComments] = useState('');
  const fileInputRef = useRef(null);

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
    if (startTime === "" || endTime === "") {
      alert("Please set both Start and End times");
      return;
    }

    if (parseFloat(startTime) >= parseFloat(endTime)) {
      alert("End time must be greater than start time");
      return;
    }

    onAddAnnotation({
      action,
      start: startTime,
      end: endTime,
      comments
    });

    setComments("");
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
    return action.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div className="panel">
      <h3>📋 Surgical Annotation</h3>

      <div className="form-group">
        <label>Action Type:</label>
        <select value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="peel">Peel</option>
          <option value="cold cut">Cold Cut</option>
          <option value="hot cut">Hot Cut</option>
          <option value="spread">Spread</option>
          <option value="cauterize">Cauterize</option>
          <option value="other">Other</option>
        </select>
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

      <div className="save-load-group">
        <button className="save-btn" onClick={saveAnnotations}>💾 Save</button>
        <button className="load-btn" onClick={loadAnnotations}>📂 Load</button>
        <button onClick={downloadCSV}>📥 Export CSV</button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="save-status">
        <span className={`status-indicator ${hasUnsavedChanges ? 'status-unsaved' : 'status-saved'}`}></span>
        {hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
      </div>

      <h4>Annotations ({annotations.length})</h4>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Start (s)</th>
              <th>End (s)</th>
              <th>Comments</th>
              <th>Action</th>
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
                <tr key={index}>
                  <td>
                    <span className={`action-badge action-${getActionClass(a.action)}`}>
                      {a.action}
                    </span>
                  </td>
                  <td>{a.start}</td>
                  <td>{a.end}</td>
                  <td className="comments-cell" title={a.comments}>
                    {a.comments || '-'}
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => onDeleteAnnotation(index)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnnotationPanel;
