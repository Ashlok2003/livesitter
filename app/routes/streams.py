from flask import Blueprint, request, jsonify, send_file
from app.services.stream_service import StreamService
import os
import logging
import time
from urllib.parse import urlparse

streams_bp = Blueprint('streams', __name__)
logger = logging.getLogger(__name__)

# Initialize stream service with absolute path
# Go up two directories from this file (/app/routes/streams.py -> /app/routes -> /app) then add hls_output
HLS_OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'hls_output'))
stream_service = StreamService(HLS_OUTPUT_DIR)

@streams_bp.route('/start', methods=['POST'])
def start_stream():
    """Start a new RTSP stream"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        rtsp_url = data.get('rtsp_url')
        stream_id = data.get('stream_id', 'default')

        if not rtsp_url:
            return jsonify({'error': 'RTSP URL is required'}), 400

        # Validate RTSP URL or file path format
        try:
            parsed_url = urlparse(rtsp_url)
            # Allow file:// or absolute paths for local testing
            if parsed_url.scheme not in ['rtsp', 'file', ''] and not rtsp_url.startswith('/'):
                return jsonify({'error': 'Invalid URL scheme. Must start with rtsp:// or file:// (or use absolute path for local files)'}), 400
        except Exception:
            return jsonify({'error': 'Invalid URL format'}), 400

        # Start the stream
        success = stream_service.start_stream(rtsp_url, stream_id)

        if not success:
            return jsonify({'error': 'Failed to start stream. Please check the RTSP URL and try again.'}), 500

        # Wait for FFmpeg to create initial segments (2-3 seconds)
        # This prevents the frontend from trying to load the playlist before it exists
        playlist_path = os.path.join(HLS_OUTPUT_DIR, stream_id, 'playlist.m3u8')
        max_wait = 5  # Maximum 5 seconds wait
        waited = 0
        while not os.path.exists(playlist_path) and waited < max_wait:
            time.sleep(0.5)
            waited += 0.5

        if not os.path.exists(playlist_path):
            logger.warning(f'Playlist not ready after {max_wait}s for stream {stream_id}')

        playlist_url = stream_service.get_hls_playlist_url(stream_id)

        logger.info(f'Stream started: {stream_id} from {rtsp_url}')
        return jsonify({
            'message': 'Stream started successfully',
            'playlist_url': playlist_url,
            'stream_id': stream_id,
            'status': 'success'
        }), 200

    except Exception as e:
        logger.error(f'Unexpected error in start_stream: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred while starting the stream'}), 500

@streams_bp.route('/stop', methods=['POST'])
def stop_stream():
    """Stop a running stream"""
    try:
        data = request.get_json()
        stream_id = data.get('stream_id', 'default')

        success = stream_service.stop_stream(stream_id)

        if not success:
            return jsonify({'error': 'Stream not found or already stopped'}), 404

        logger.info(f'Stream stopped: {stream_id}')
        return jsonify({
            'message': 'Stream stopped successfully',
            'status': 'success'
        }), 200

    except Exception as e:
        logger.error(f'Unexpected error in stop_stream: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred while stopping the stream'}), 500

@streams_bp.route('/status', methods=['GET'])
def get_stream_status():
    """Get status of all streams"""
    try:
        active_streams = stream_service.get_active_streams_info()

        return jsonify({
            'active_streams': active_streams,
            'total_streams': len(active_streams),
            'status': 'success'
        }), 200

    except Exception as e:
        logger.error(f'Unexpected error in get_stream_status: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500

@streams_bp.route('/<stream_id>/playlist.m3u8')
def get_playlist(stream_id):
    """Serve HLS playlist"""
    try:
        # Try to get stream info from active streams
        stream_info = stream_service.get_stream_info(stream_id)

        # If stream not active, check if files exist on disk
        if not stream_info:
            playlist_path = os.path.join(stream_service.hls_output_dir, stream_id, 'playlist.m3u8')
            logger.info(f'Checking for playlist at: {playlist_path}')
            logger.info(f'File exists: {os.path.exists(playlist_path)}')
        else:
            playlist_path = os.path.join(stream_info['hls_path'], 'playlist.m3u8')

        if not os.path.exists(playlist_path):
            logger.warning(f'Playlist not found at: {playlist_path}')
            return jsonify({'error': 'Playlist not available. Stream may not be ready yet.'}), 404

        return send_file(playlist_path, mimetype='application/vnd.apple.mpegurl')

    except Exception as e:
        logger.error(f'Error serving playlist for {stream_id}: {str(e)}')
        return jsonify({'error': 'Error serving playlist'}), 500

@streams_bp.route('/<stream_id>/<segment>')
def get_segment(stream_id, segment):
    """Serve HLS segment"""
    try:
        # Try to get stream info from active streams
        stream_info = stream_service.get_stream_info(stream_id)

        # If stream not active, check if files exist on disk
        if not stream_info:
            segment_path = os.path.join(stream_service.hls_output_dir, stream_id, segment)
        else:
            segment_path = os.path.join(stream_info['hls_path'], segment)

        if not os.path.exists(segment_path):
            return jsonify({'error': 'Segment not found'}), 404

        return send_file(segment_path, mimetype='video/MP2T')

    except Exception as e:
        logger.error(f'Error serving segment {segment} for {stream_id}: {str(e)}')
        return jsonify({'error': 'Error serving segment'}), 500
