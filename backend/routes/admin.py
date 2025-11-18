from flask import Blueprint
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from db import get_db

# Blueprint for admin (optional if you want a URL prefix)
admin_bp = Blueprint('admin_bp', __name__)

def init_admin(app):
    from your_models import User, Course, Enrollment  # We'll define these
    db = SQLAlchemy(app)

    admin = Admin(app, name="ACME Admin", template_mode="bootstrap3")
    
    # Add models
    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Course, db.session))
    admin.add_view(ModelView(Enrollment, db.session))

    return admin
