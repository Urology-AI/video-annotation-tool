from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import os, subprocess

app = FastAPI()

VIDEO_EXTS = (".mp4", ".mov", ".avi", ".mkv", ".webm")
CLIP_DIR = "clips"

os.makedirs(CLIP_DIR, exist_ok=True)

class ClipRequest(BaseModel):
    video: str
    action: str
    start: float
    end: float


class ConvertRequest(BaseModel):
    video: str


@app.get("/")
def index():
    return FileResponse("index.html")


@app.get("/list")
def list_videos():
    files = [f for f in os.listdir(".") if f.lower().endswith(VIDEO_EXTS)]
    return JSONResponse(files)


@app.post("/export_clip")
def export_clip(req: ClipRequest):
    if not os.path.exists(req.video):
        return JSONResponse({"error": "video not found"}, status_code=404)

    safe_action = req.action.replace(" ", "_").replace("/", "-")
    clip_name = f"{os.path.splitext(req.video)[0]}_{safe_action}_{req.start:.1f}_{req.end:.1f}.mp4"
    clip_path = os.path.join(CLIP_DIR, clip_name)

    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(req.start),
        "-to", str(req.end),
        "-i", req.video,
        "-c", "copy",
        "-movflags", "faststart",
        clip_path
    ]

    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    if not os.path.exists(clip_path):
        return JSONResponse({"error": "clip export failed"}, status_code=500)

    return {"clip": clip_name}


@app.post("/convert_to_streaming")
def convert_to_streaming(req: ConvertRequest):
    if not os.path.exists(req.video):
        return JSONResponse({"error": "video not found"}, status_code=404)
    base, ext = os.path.splitext(req.video)
    out_name = f"{base}_fast.mp4"
    cmd = [
        "ffmpeg",
        "-y",
        "-i", req.video,
        "-movflags", "faststart",
        "-c", "copy",
        out_name,
    ]
    result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0 or not os.path.exists(out_name):
        return JSONResponse(
            {"error": "convert failed", "detail": result.stderr or "unknown"},
            status_code=500,
        )
    return {"output": out_name}


@app.get("/clips/{clip_name}")
def get_clip(clip_name: str):
    path = os.path.join(CLIP_DIR, clip_name)
    if not os.path.exists(path):
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(path, media_type="video/mp4", filename=clip_name)


@app.get("/{path:path}")
def static_files(path: str):
    if not os.path.exists(path):
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(path)