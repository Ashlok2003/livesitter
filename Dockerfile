FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p hls_output logs

# Download test video for local testing
# Using 10-second video for quick testing. For longer videos, use your own RTSP camera.
RUN apt-get update && apt-get install -y wget && \
  wget -O /app/test_video.mp4 "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4" || \
  echo "Test video download failed, but continuing..." && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app.wsgi:app"]
