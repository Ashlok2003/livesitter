from datetime import datetime
from bson import ObjectId
from app import mongo
import json

class OverlayModel:
    @staticmethod
    def create_overlay(data):
        """Create a new overlay in the database"""
        try:
            overlay_data = {
                'name': data['name'],
                'type': data['type'],
                'content': data['content'],
                'position': {
                    'x': float(data['position']['x']),
                    'y': float(data['position']['y'])
                },
                'size': {
                    'width': float(data['size']['width']),
                    'height': float(data['size']['height'])
                },
                'style': data.get('style', {}),
                'is_active': data.get('is_active', True),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }

            result = mongo.db.overlays.insert_one(overlay_data)
            return str(result.inserted_id), None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_overlay(overlay_id):
        """Get a single overlay by ID"""
        try:
            if not ObjectId.is_valid(overlay_id):
                return None, "Invalid overlay ID"

            overlay = mongo.db.overlays.find_one({'_id': ObjectId(overlay_id)})
            if not overlay:
                return None, "Overlay not found"
            return overlay, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def get_all_overlays():
        """Get all active overlays"""
        try:
            overlays = list(mongo.db.overlays.find({'is_active': True}).sort('created_at', -1))
            return overlays, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def update_overlay(overlay_id, data):
        """Update an existing overlay"""
        try:
            if not ObjectId.is_valid(overlay_id):
                return False, "Invalid overlay ID"

            update_data = {**data, 'updated_at': datetime.utcnow()}

            result = mongo.db.overlays.update_one(
                {'_id': ObjectId(overlay_id)},
                {'$set': update_data}
            )

            if result.matched_count == 0:
                return False, "Overlay not found"
            return True, None
        except Exception as e:
            return False, str(e)

    @staticmethod
    def delete_overlay(overlay_id):
        """Delete an overlay"""
        try:
            if not ObjectId.is_valid(overlay_id):
                return False, "Invalid overlay ID"

            result = mongo.db.overlays.delete_one({'_id': ObjectId(overlay_id)})

            if result.deleted_count == 0:
                return False, "Overlay not found"
            return True, None
        except Exception as e:
            return False, str(e)

    @staticmethod
    def serialize_overlay(overlay):
        """Convert MongoDB document to JSON serializable format"""
        if not overlay:
            return None

        overlay['_id'] = str(overlay['_id'])
        overlay['created_at'] = overlay['created_at'].isoformat() + 'Z'
        overlay['updated_at'] = overlay['updated_at'].isoformat() + 'Z'
        return overlay
