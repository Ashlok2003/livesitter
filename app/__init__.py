from flask import Flask, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from .config import config
import logging
from logging.handlers import RotatingFileHandler
import os

mongo = PyMongo()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')

        file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)

        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Application startup successfully !')

    mongo.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # Registering the blueprints
    from app.routes.overlays import overlays_bp
    from app.routes.streams import streams_bp
    from app.routes.settings import settings_bp

    app.register_blueprint(overlays_bp, url_prefix='/api/overlays')
    app.register_blueprint(streams_bp, url_prefix='/api/streams')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')


    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        return jsonify({'error': 'An internal error occurred'}), 500

    @app.errorhandler(413)
    def too_large(error):
        return jsonify({'error': 'File too large'}), 413

    return app
