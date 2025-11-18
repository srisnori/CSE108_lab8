from flask import Blueprint, jsonify, request
from db import get_db

bp = Blueprint("teacher", __name__)

@bp.route("/teacher/courses/<string:username>", methods=["GET"])
def teacher_courses(username):
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        SELECT 
            c.id AS course_id,
            c.name AS course_name,
            c.time,
            c.capacity,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id) AS enrolled
        FROM courses c
        WHERE c.instructor = ?
    """, (username,))
    
    courses = [dict(row) for row in cur.fetchall()]
    return jsonify(courses)



# Get all students in a course
@bp.route("/teacher/course/<int:course_id>/students", methods=["GET"])
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


# Update grade for a student
@bp.route("/teacher/grade", methods=["POST"])
def update_grade():
    data = request.get_json()
    enrollment_id = data["enrollment_id"]
    new_grade = int(data["grade"])  # ensure it's numeric

    db = get_db()
    cur = db.cursor()

    # Overwrite with new numeric grade
    cur.execute("UPDATE enrollments SET grade=? WHERE id=?", (new_grade, enrollment_id))
    db.commit()

    return jsonify({"status": "ok"})
