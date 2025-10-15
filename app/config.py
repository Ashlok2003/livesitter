import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'ashlokchaudhary'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/livestream_app'
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'

    # RTSP Configuration
    RTSP_STREAM_TIMEOUT = 30
    HLS_OUTPUT_DIR = './hls_output'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')

    # Upload configuration
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg'}
    UPLOAD_FOLDER = './uploads'

    # Stream configuration
    STREAM_TIMEOUT = 300

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/livestream_app_dev'

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://mongodb:27017/livestream_app'

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/livestream_app_test'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
