from flask import Blueprint, render_template
from db import get_db

admin_bp = Blueprint("admin", __name__, template_folder="templates")

@admin_bp.route("/")
def admin_home():
    db = get_db()

    teachers = db.execute("SELECT * FROM teachers").fetchall()
    students = db.execute("SELECT * FROM students").fetchall()
    courses = db.execute("SELECT * FROM courses").fetchall()
    enrollments = db.execute("SELECT * FROM enrollments").fetchall()

    return render_template(
        "admin_home.html",
        teachers=teachers,
        students=students,
        courses=courses,
        enrollments=enrollments,
    )
