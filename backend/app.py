from flask import Flask
from flask_cors import CORS
from db import get_db
from routes import auth, student, teacher

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

app.register_blueprint(auth.bp, url_prefix="/api")
app.register_blueprint(student.bp, url_prefix="/api")
app.register_blueprint(teacher.bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)
