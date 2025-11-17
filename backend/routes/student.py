from flask import Blueprint, request, jsonify
from db import get_db

bp = Blueprint("student", __name__)

@bp.route("/student/enrolled/<int:student_id>", methods=["GET"])
def get_enrolled(student_id):
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        SELECT courses.course_name, courses.course_code, enrollments.grade
        FROM enrollments
        JOIN courses ON courses.id = enrollments.course_id
        WHERE enrollments.student_id=?
    """, (student_id,))
    return jsonify([dict(row) for row in cur.fetchall()])

@bp.route("/student/courses", methods=["GET"])
def all_courses():
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM courses")
    return jsonify([dict(row) for row in cur.fetchall()])

@bp.route("/student/enroll", methods=["POST"])
def enroll():
    data = request.get_json()
    student_id = data["student_id"]
    course_id = data["course_id"]

    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
                    (student_id, course_id))
        db.commit()
    except:
        return jsonify({"error": "Already enrolled"}), 400

    return jsonify({"status": "ok"})