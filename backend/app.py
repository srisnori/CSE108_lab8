import os
from flask import Flask, send_from_directory
from flask_cors import CORS
# Assuming db.py is at the root level and contains init_db and close_db
from db import init_db, close_db 
# Assuming routes folder is at the root level and contains the blueprints
from routes import auth, student, teacher 

def create_app(test_config=None):
    # 1. APPLICATION SETUP & CONFIGURATION
    # Set static_folder to the directory containing your HTML files
    # FIX: Removed 'instance_relative_path=True' to avoid the TypeError when running with 'python app.py'.
    app = Flask(__name__, static_folder='frontend/pages')
    
    app.config.from_mapping(
        SECRET_KEY='dev_secret_key',
        # Path to your SQLite database file
        DATABASE='acme.db', 
    )

    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists (Necessary for Flask configuration management)
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # 2. DATABASE LIFECYCLE MANAGEMENT
    
    # Register the function to close the database connection after each request
    app.teardown_appcontext(close_db)

    # Register CLI command to manually initialize the database
    @app.cli.command('init-db')
    def init_db_command():
        """Clear the existing data and create new tables."""
        print("Initializing database...")
        init_db(app) # Call the initialization function from db.py
        print("Database initialized.")

    # 3. BLUEPRINTS & CORS
    
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    app.register_blueprint(auth.bp, url_prefix="/api")
    app.register_blueprint(student.bp, url_prefix="/api")
    app.register_blueprint(teacher.bp, url_prefix="/api")
    
    # 4. FRONTEND SERVING
    
    # Route to serve the main student dashboard HTML file when visiting the root path (/)
    @app.route('/')
    def index():
        # Flask looks in the defined static_folder ('frontend/pages') for 'student.html'
        return app.send_static_file('student.html') 

    # Route to serve the HTML file if accessed via /pages/student.html (which you were doing)
    @app.route('/pages/<path:filename>')
    def serve_page(filename):
        """Serve files directly from the static_folder (frontend/pages)."""
        return send_from_directory(app.static_folder, filename)

    return app

# Initialize the app instance
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)