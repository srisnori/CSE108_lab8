from flask import Blueprint, request, jsonify
from db import get_db

bp = Blueprint("teacher", __name__)

@bp.route("/teacher/courses/<int:teacher_id>", methods=["GET"])
def teacher_courses(teacher_id):
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM courses WHERE teacher_id=?", (teacher_id,))
    return jsonify([dict(row) for row in cur.fetchall()])

@bp.route("/teacher/course/<int:course_id>", methods=["GET"])
def course_students(course_id):
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        SELECT enrollments.id AS enrollment_id, users.username, enrollments.grade
        FROM enrollments
        JOIN users ON users.id = enrollments.student_id
        WHERE enrollments.course_id=?
    """, (course_id,))
    return jsonify([dict(row) for row in cur.fetchall()])

@bp.route("/teacher/grade", methods=["POST"])
def update_grade():
    data = request.get_json()
    enrollment_id = data["enrollment_id"]
    grade = data["grade"]

    db = get_db()
    cur = db.cursor()
    cur.execute("UPDATE enrollments SET grade=? WHERE id=?", (grade, enrollment_id))
    db.commit()

    return jsonify({"status": "ok"})