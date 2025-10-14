from flask import Blueprint, request, jsonify
from app.models.overlay import OverlayModel
from bson import ObjectId
import logging

overlays_bp = Blueprint('overlays', __name__)
logger = logging.getLogger(__name__)

@overlays_bp.route('/', methods=['POST'])
def create_overlay():
    """Create a new overlay"""
    try:
        data = request.get_json()

        # Validation
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        required_fields = ['name', 'type', 'content', 'position', 'size']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Validate position and size
        if 'x' not in data['position'] or 'y' not in data['position']:
            return jsonify({'error': 'Position must contain x and y coordinates'}), 400

        if 'width' not in data['size'] or 'height' not in data['size']:
            return jsonify({'error': 'Size must contain width and height'}), 400

        overlay_id, error = OverlayModel.create_overlay(data)

        if error:
            logger.error(f'Error creating overlay: {error}')
            return jsonify({'error': error}), 400

        logger.info(f'Overlay created with ID: {overlay_id}')
        return jsonify({
            'id': overlay_id,
            'message': 'Overlay created successfully',
            'status': 'success'
        }), 201

    except Exception as e:
        logger.error(f'Unexpected error in create_overlay: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500

@overlays_bp.route('/', methods=['GET'])
def get_overlays():
    """Get all overlays"""
    try:
        overlays, error = OverlayModel.get_all_overlays()

        if error:
            logger.error(f'Error fetching overlays: {error}')
            return jsonify({'error': error}), 500

        # Serialize overlays
        serialized_overlays = [OverlayModel.serialize_overlay(overlay) for overlay in overlays]

        return jsonify({
            'overlays': serialized_overlays,
            'count': len(serialized_overlays),
            'status': 'success'
        }), 200

    except Exception as e:
        logger.error(f'Unexpected error in get_overlays: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500

@overlays_bp.route('/<overlay_id>', methods=['GET'])
def get_overlay(overlay_id):
    """Get a specific overlay"""
    try:
        overlay, error = OverlayModel.get_overlay(overlay_id)

        if error:
            return jsonify({'error': error}), 404

        serialized_overlay = OverlayModel.serialize_overlay(overlay)

        return jsonify({
            'overlay': serialized_overlay,
            'status': 'success'
        }), 200

    except Exception as e:
        logger.error(f'Unexpected error in get_overlay: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500

@overlays_bp.route('/<overlay_id>', methods=['PUT'])
def update_overlay(overlay_id):
    """Update an overlay"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        success, error = OverlayModel.update_overlay(overlay_id, data)

        if error:
            return jsonify({'error': error}), 404 if "not found" in error else 400

        logger.info(f'Overlay updated: {overlay_id}')
        return jsonify({
            'message': 'Overlay updated successfully',
            'status': 'success'
        }), 200

    except Exception as e:
        logger.error(f'Unexpected error in update_overlay: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500

@overlays_bp.route('/<overlay_id>', methods=['DELETE'])
def delete_overlay(overlay_id):
    """Delete an overlay"""
    try:
        success, error = OverlayModel.delete_overlay(overlay_id)

        if error:
            return jsonify({'error': error}), 404 if "not found" in error else 400

        logger.info(f'Overlay deleted: {overlay_id}')
        return jsonify({
            'message': 'Overlay deleted successfully',
            'status': 'success'
        }), 200

    except Exception as e:
        logger.error(f'Unexpected error in delete_overlay: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500
