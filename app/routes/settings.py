from flask import Blueprint, request, jsonify
from app import mongo
from bson import ObjectId
import logging
from datetime import datetime

settings_bp = Blueprint('settings', __name__)
logger = logging.getLogger(__name__)

@settings_bp.route('/', methods=['GET'])
def get_settings():
    """Get application settings"""
    try:
        settings = mongo.db.settings.find_one({'type': 'app_settings'})

        if not settings:
            # Return default settings
            default_settings = {
                'auto_start_streams': False,
                'default_stream_quality': '720p',
                'max_concurrent_streams': 5,
                'retention_days': 7,
                'notifications_enabled': True
            }
            return jsonify({
                'settings': default_settings,
                'status': 'success'
            }), 200

        # Remove MongoDB ID
        settings.pop('_id', None)
        settings.pop('type', None)

        return jsonify({
            'settings': settings,
            'status': 'success'
        }), 200

    except Exception as e:
        logger.error(f'Error fetching settings: {str(e)}')
        return jsonify({'error': 'Failed to fetch settings'}), 500

@settings_bp.route('/', methods=['POST'])
def update_settings():
    """Update application settings"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Validate settings
        valid_settings = {
            'auto_start_streams': bool,
            'default_stream_quality': str,
            'max_concurrent_streams': int,
            'retention_days': int,
            'notifications_enabled': bool
        }

        for key, value_type in valid_settings.items():
            if key in data and not isinstance(data[key], value_type):
                return jsonify({'error': f'Invalid type for setting: {key}'}), 400

        # Update or insert settings
        update_data = {
            'type': 'app_settings',
            **data,
            'updated_at': datetime.utcnow()
        }

        result = mongo.db.settings.update_one(
            {'type': 'app_settings'},
            {'$set': update_data},
            upsert=True
        )

        logger.info('Application settings updated')
        return jsonify({
            'message': 'Settings updated successfully',
            'status': 'success'
        }), 200

    except Exception as e:
        logger.error(f'Error updating settings: {str(e)}')
        return jsonify({'error': 'Failed to update settings'}), 500

@settings_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        mongo.db.command('ping')

        # Check if collections exist
        collections = mongo.db.list_collection_names()

        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'collections': collections,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 200

    except Exception as e:
        logger.error(f'Health check failed: {str(e)}')
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 503
