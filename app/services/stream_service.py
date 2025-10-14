import subprocess
import os
import threading
import time
from datetime import datetime
import logging
import signal
import psutil

logger = logging.getLogger(__name__)

class StreamService:
    def __init__(self, hls_output_dir):
        self.hls_output_dir = hls_output_dir
        self.active_streams = {}
        self._ensure_output_dir()
        self._cleanup_stale_streams()

    def _ensure_output_dir(self):
        """Ensure the HLS output directory exists"""
        if not os.path.exists(self.hls_output_dir):
            os.makedirs(self.hls_output_dir)
            logger.info(f'Created HLS output directory: {self.hls_output_dir}')

    def _cleanup_stale_streams(self):
        """Clean up stale stream directories on startup"""
        try:
            for stream_id in os.listdir(self.hls_output_dir):
                stream_path = os.path.join(self.hls_output_dir, stream_id)
                if os.path.isdir(stream_path):
                    # Removing directories older than 1 hour
                    dir_time = os.path.getctime(stream_path)
                    if time.time() - dir_time > 3600:  # 1 hour
                        import shutil
                        shutil.rmtree(stream_path)
                        logger.info(f'Cleaned up stale stream directory: {stream_id}')
        except Exception as e:
            logger.error(f'Error cleaning up stale streams: {str(e)}')

    def start_stream(self, rtsp_url, stream_id):
        """Convert RTSP to HLS for browser compatibility"""
        try:
            # Stop existing stream with same ID
            if stream_id in self.active_streams:
                self.stop_stream(stream_id)

            # Create stream directory
            hls_path = os.path.join(self.hls_output_dir, stream_id)
            if not os.path.exists(hls_path):
                os.makedirs(hls_path)

            # FFmpeg command to convert RTSP to HLS
            command = [
                'ffmpeg',
                '-i', rtsp_url,
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-f', 'hls',
                '-hls_time', '2',
                '-hls_list_size', '5',
                '-hls_flags', 'delete_segments',
                '-hls_segment_filename', os.path.join(hls_path, 'segment_%03d.ts'),
                os.path.join(hls_path, 'playlist.m3u8')
            ]

            # Start FFmpeg process
            process = subprocess.Popen(
                command,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE,
                preexec_fn=os.setsid  # Create process group for proper cleanup
            )

            # Log FFmpeg stderr in a separate thread (filter out verbose version info)
            def _log_stderr(proc):
                for line in proc.stderr:
                    decoded_line = line.decode().strip()
                    # Skip version/build info lines
                    if not any(skip in decoded_line for skip in ['ffmpeg version', 'built with', 'configuration:', 'lib']):
                        if decoded_line:  # Only log non-empty lines
                            logger.error(f'FFmpeg: {decoded_line}')
            threading.Thread(target=_log_stderr, args=(process,), daemon=True).start()

            self.active_streams[stream_id] = {
                'process': process,
                'started_at': datetime.utcnow(),
                'hls_path': hls_path,
                'rtsp_url': rtsp_url,
                'command': command
            }

            # Monitor process in separate thread
            monitor_thread = threading.Thread(
                target=self._monitor_process,
                args=(stream_id, process)
            )
            monitor_thread.daemon = True
            monitor_thread.start()

            logger.info(f'Started stream {stream_id} from {rtsp_url}')
            return True

        except Exception as e:
            logger.error(f"Error starting stream {stream_id}: {e}")
            # Clean up on failure
            if stream_id in self.active_streams:
                del self.active_streams[stream_id]
            return False

    def stop_stream(self, stream_id):
        """Stop a running stream"""
        if stream_id in self.active_streams:
            try:
                process = self.active_streams[stream_id]['process']

                # Kill the process group to ensure all child processes are terminated
                try:
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                except (ProcessLookupError, OSError):
                    # Process might already be dead
                    process.terminate()

                # Wait for process to terminate
                process.wait(timeout=10)

                # Clean up directory
                hls_path = self.active_streams[stream_id]['hls_path']
                if os.path.exists(hls_path):
                    import shutil
                    shutil.rmtree(hls_path)

                del self.active_streams[stream_id]
                logger.info(f'Stopped stream: {stream_id}')
                return True

            except Exception as e:
                logger.error(f"Error stopping stream {stream_id}: {e}")
                # Force kill if normal termination fails
                if stream_id in self.active_streams:
                    try:
                        process = self.active_streams[stream_id]['process']
                        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                    except:
                        pass
                    del self.active_streams[stream_id]
                return False
        return False

    def _monitor_process(self, stream_id, process):
        """Monitor FFmpeg process and clean up if it dies"""
        try:
            # Wait for process to complete
            stdout, stderr = process.communicate(timeout=5)

            if process.returncode != 0:
                logger.error(f"Stream {stream_id} process exited with code {process.returncode}")
                if stderr:
                    logger.error(f"FFmpeg error: {stderr.decode('utf-8')}")
        except subprocess.TimeoutExpired:
            # Process is still running, continue monitoring
            pass
        except Exception as e:
            logger.error(f"Error monitoring stream {stream_id}: {e}")

        # Clean up if process died
        if stream_id in self.active_streams and process.poll() is not None:
            logger.info(f"Stream {stream_id} process terminated")
            del self.active_streams[stream_id]

    def get_stream_info(self, stream_id):
        """Get information about a specific stream"""
        return self.active_streams.get(stream_id)

    def get_hls_playlist_url(self, stream_id):
        """Get the HLS playlist URL for a stream"""
        if stream_id in self.active_streams:
            return f'/api/streams/{stream_id}/playlist.m3u8'
        return None

    def get_active_streams_info(self):
        """Get information about all active streams"""
        active_streams_info = []
        for stream_id, info in self.active_streams.items():
            process = info['process']
            active_streams_info.append({
                'stream_id': stream_id,
                'rtsp_url': info['rtsp_url'],
                'started_at': info['started_at'].isoformat() + 'Z',
                'status': 'running' if process.poll() is None else 'stopped',
                'playlist_url': self.get_hls_playlist_url(stream_id)
            })
        return active_streams_info

    def stop_all_streams(self):
        """Stop all active streams"""
        stream_ids = list(self.active_streams.keys())
        for stream_id in stream_ids:
            self.stop_stream(stream_id)
        logger.info('Stopped all active streams')
