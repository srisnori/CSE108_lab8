from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from models import User, Course, Enrollment, db_session

def init_admin(app):
    admin = Admin(app, name="ACME Admin")

    admin.add_view(ModelView(User, db_session))
    admin.add_view(ModelView(Course, db_session))
    admin.add_view(ModelView(Enrollment, db_session))