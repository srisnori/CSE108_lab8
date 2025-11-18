import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from db import init_db, close_db
from routes import auth, student, teacher
from admin import admin_bp

def create_app(test_config=None):
    app = Flask(__name__, static_folder="../frontend/pages")

    app.config.from_mapping(
        SECRET_KEY="dev_secret_key",
        DATABASE="acme.db",
    )

    if test_config:
        app.config.from_mapping(test_config)
    else:
        app.config.from_pyfile("config.py", silent=True)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    app.teardown_appcontext(close_db)

    @app.cli.command("init-db")
    def init_db_command():
        print("Initializing database...")
        init_db(app)
        print("Database initialized.")

    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    app.register_blueprint(auth.bp, url_prefix="/api")
    app.register_blueprint(student.bp, url_prefix="/api")
    app.register_blueprint(teacher.bp, url_prefix="/api")

    # ADMIN PAGE
    app.register_blueprint(admin_bp, url_prefix="/admin")

    @app.route("/")
    def index():
        return app.send_static_file("student.html")

    @app.route("/pages/<path:filename>")
    def serve_page(filename):
        return send_from_directory(app.static_folder, filename)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)

