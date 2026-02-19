# Surgical Video Annotation Tool

A modern React-based web application for annotating surgical videos with actions, timestamps, and comments.

## Features

- 🎥 **Video Playback**: Load and play video files with customizable playback speed
- ⏱️ **Precise Timing**: Set start and end times for annotations with frame-accurate controls
- 📝 **Action Annotation**: Categorize surgical actions (peel, cold cut, hot cut, spread, cauterize, other)
- 💾 **Save & Load**: Auto-save to browser storage and export/import JSON/CSV files
- ⌨️ **Keyboard Shortcuts**: Spacebar for play/pause, arrow keys for navigation
- 🎨 **Modern UI**: Clean, professional interface designed for medical use

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/video-annotation-tool.git
cd video-annotation-tool
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Deployment to GitHub Pages

1. Update the `homepage` field in `package.json` with your GitHub Pages URL:
```json
"homepage": "https://YOUR_USERNAME.github.io/video-annotation-tool"
```

2. Install gh-pages if not already installed:
```bash
npm install --save-dev gh-pages
```

3. Deploy to GitHub Pages:
```bash
npm run deploy
```

This will:
- Build the app for production
- Deploy it to the `gh-pages` branch
- Make it available at your GitHub Pages URL

### Manual Deployment Steps

If you prefer manual deployment:

1. Build the app:
```bash
npm run build
```

2. Push the `build` folder contents to the `gh-pages` branch:
```bash
git subtree push --prefix build origin gh-pages
```

Or use GitHub Actions for automatic deployment on push.

## Usage

1. **Load a Video**: Click "📁 Load Video" and select a video file
2. **Navigate**: Use arrow keys or skip controls to find the annotation point
3. **Set Times**: Click "Set Start" and "Set End" buttons or enter times manually
4. **Add Annotation**: Select action type, enter comments, and click "➕ Add Annotation"
5. **Save**: Annotations auto-save to browser storage. Use "💾 Save" to download JSON file
6. **Export**: Click "📥 Export CSV" to download annotations as CSV

## Keyboard Shortcuts

- **Spacebar**: Play/Pause video
- **Left Arrow**: Skip backward
- **Right Arrow**: Skip forward

## File Formats

### JSON Format
```json
{
  "videoBasename": "surgery_video",
  "annotations": [
    {
      "action": "peel",
      "start": "10.5",
      "end": "15.2",
      "comments": "Initial tissue separation"
    }
  ],
  "timestamp": "2026-02-19T12:00:00.000Z",
  "version": "1.0"
}
```

### CSV Format
```csv
action,start_time,end_time,comments
peel,10.5,15.2,"Initial tissue separation"
```

## Technologies Used

- React 18
- Create React App
- CSS3
- LocalStorage API
- File API

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
