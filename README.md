# Video Annotation Tool

A simple web app for annotating videos with timestamps and action labels. Designed for labeling surgical or procedural actions (e.g. peel, cold cut, hot cut, spread, cauterize) with start/end times and optional comments. Annotations are stored as CSV and you can export clips for each segment.

## Requirements

- **Python 3.8+** with FastAPI and Uvicorn
- **ffmpeg** (for clip export)

```bash
pip install fastapi uvicorn pydantic
```

## Run

From the project directory:

```bash
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Then open **http://localhost:8000** in your browser.

Place video files (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`) in the same directory as `server.py`; they will appear in the "Select video…" dropdown.

## Usage

1. **Select a video** from the dropdown.
2. **Scrub** to a frame and click **Set Start** or **Set End** to fill the annotation times (or type them manually).
3. Choose an **Action** (peel, cold cut, hot cut, spread, cauterize, other) and add **Comments** if needed.
4. Click **Add Annotation** to add a row to the table.
5. **Download CSV** to save annotations; the file is named like `yourvideo.csv` next to the video.
6. If a `.csv` with the same base name as the video exists, it is loaded when you select that video.
7. Use **Export** on a row to create a clip (via ffmpeg) and download it; clips are saved in the `clips/` folder.
8. **Convert to streaming** re-muxes the current video with `-movflags faststart -c copy` and saves it as `videoname_fast.mp4` in the same folder (no re-encode). Use this if the video doesn’t seek or stream well because metadata is at the end of the file.

## CSV format

```text
action,start,end,comments
peel,10.5,15.2,"some note"
cold cut,20.0,25.1,
```

## Clip export

Clip export uses ffmpeg (stream copy, no re-encode). Clips are named like `videoname_action_10.5_15.2.mp4` (e.g. `surgery_peel_10.5_15.2.mp4`) and served from `/clips/`. Ensure **ffmpeg** is installed and on your `PATH`.
