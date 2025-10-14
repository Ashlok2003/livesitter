import re
from urllib.parse import urlparse

class Validators:
    @staticmethod
    def validate_rtsp_url(url):
        """Validate RTSP URL or file path format"""
        try:
            # Allow file:// for local testing
            if url.startswith('file://') or url.startswith('/'):
                return True, None

            parsed = urlparse(url)
            if parsed.scheme != 'rtsp':
                return False, "URL must use RTSP protocol or file:// for local files"
            if not parsed.netloc:
                return False, "URL must contain a network location"
            return True, None
        except Exception:
            return False, "Invalid URL format"

    @staticmethod
    def validate_overlay_data(data):
        """Validate overlay creation/update data"""
        required_fields = ['name', 'type', 'content', 'position', 'size']
        for field in required_fields:
            if field not in data:
                return False, f"Missing required field: {field}"

        if data['type'] not in ['text', 'image']:
            return False, "Type must be either 'text' or 'image'"

        # Validate position
        if 'x' not in data['position'] or 'y' not in data['position']:
            return False, "Position must contain x and y coordinates"

        # Validate size
        if 'width' not in data['size'] or 'height' not in data['size']:
            return False, "Size must contain width and height"

        try:
            float(data['position']['x'])
            float(data['position']['y'])
            float(data['size']['width'])
            float(data['size']['height'])
        except (ValueError, TypeError):
            return False, "Position and size values must be numbers"

        return True, None
