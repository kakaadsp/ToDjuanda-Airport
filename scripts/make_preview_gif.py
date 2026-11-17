"""
Converts first ~10 seconds of todjuanda.mp4 into a looping GIF preview
optimised for GitHub README (≤ 10 MB, 800px wide, 12 fps).
"""
import cv2
from PIL import Image
import os

VIDEO_PATH = "public/media/todjuanda.mp4"
OUTPUT_GIF = "public/media/preview.gif"

# Settings
TARGET_WIDTH = 800
FPS_OUT     = 12          # frames per second in GIF
DURATION_S  = 10          # how many seconds to capture
SKIP_START  = 2           # skip first N seconds (usually loading screen)

cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    raise RuntimeError(f"Cannot open video: {VIDEO_PATH}")

src_fps   = cap.get(cv2.CAP_PROP_FPS) or 30
src_w     = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
src_h     = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Compute target height keeping aspect ratio
scale      = TARGET_WIDTH / src_w
target_h   = int(src_h * scale)

# Frame step: skip frames so we only capture at FPS_OUT
frame_step  = max(1, round(src_fps / FPS_OUT))
start_frame = int(SKIP_START * src_fps)
end_frame   = int((SKIP_START + DURATION_S) * src_fps)

cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

frames = []
frame_idx = start_frame
while frame_idx <= end_frame:
    ret, frame = cap.read()
    if not ret:
        break

    if (frame_idx - start_frame) % frame_step == 0:
        # BGR → RGB, resize
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(rgb)
        img = img.resize((TARGET_WIDTH, target_h), Image.LANCZOS)
        # Quantise to 256 colours (required for GIF)
        img = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
        frames.append(img)

    frame_idx += 1

cap.release()

if not frames:
    raise RuntimeError("No frames captured — check video path / SKIP_START value")

duration_ms = int(1000 / FPS_OUT)   # ms per frame

frames[0].save(
    OUTPUT_GIF,
    save_all=True,
    append_images=frames[1:],
    loop=0,
    duration=duration_ms,
    optimize=True,
)

size_mb = os.path.getsize(OUTPUT_GIF) / 1_048_576
print(f"✅  GIF saved → {OUTPUT_GIF}")
print(f"   Frames  : {len(frames)}")
print(f"   Size    : {size_mb:.2f} MB")
print(f"   Dims    : {TARGET_WIDTH}x{target_h}")
print(f"   Duration: ~{len(frames) / FPS_OUT:.1f}s")
