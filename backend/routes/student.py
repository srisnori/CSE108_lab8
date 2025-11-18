from flask import Blueprint, jsonify, request
from db import get_db

bp = Blueprint("student", __name__)

@bp.route("/student/courses/my/<int:student_id>", methods=["GET"])
def get_my_courses(student_id):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT 
            courses.id AS course_id,
            courses.course_name,
            courses.time,
            users.username AS teacher_name
        FROM enrollments
        JOIN courses ON enrollments.course_id = courses.id
        JOIN users ON courses.teacher_id = users.id
        WHERE enrollments.student_id = ?
    """, (student_id,))

    rows = [dict(row) for row in cur.fetchall()]
    return jsonify(rows)

@bp.route("/student/courses/available", methods=["GET"])
def get_available_courses():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT 
            courses.id AS course_id,
            courses.course_name,
            courses.time,
            users.username AS teacher_name,
            courses.capacity,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = courses.id) AS enrolled_count
        FROM courses
        JOIN users ON courses.teacher_id = users.id
    """)

    rows = []
    for row in cur.fetchall():
        row = dict(row)
        row["is_full"] = 1 if row["enrolled_count"] >= row["capacity"] else 0
        row["enrollment_display"] = f"{row['enrolled_count']}/{row['capacity']}"
        rows.append(row)

    return jsonify(rows)

@bp.route("/student/enroll", methods=["POST"])
def enroll():
    data = request.get_json()
    student_id = data["student_id"]
    course_id = data["course_id"]

    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT id FROM enrollments WHERE student_id=? AND course_id=?",
                (student_id, course_id))
    if cur.fetchone():
        return jsonify({"error": "Already enrolled"}), 400

    cur.execute("INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
                (student_id, course_id))
    db.commit()

    return jsonify({"message": "Successfully enrolled!"})


@bp.route("/student/unenroll", methods=["POST"])
def unenroll():
    data = request.get_json()
    student_id = data["student_id"]
    course_id = data["course_id"]

    db = get_db()
    cur = db.cursor()

    cur.execute("DELETE FROM enrollments WHERE student_id=? AND course_id=?",
                (student_id, course_id))
    db.commit()

    return jsonify({"message": "Successfully dropped the course"})

