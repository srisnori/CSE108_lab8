from flask import Blueprint, jsonify, request
from db import get_db

bp = Blueprint("student", __name__)

# -----------------------------
# Get courses the student is enrolled in
# -----------------------------
@bp.route("/student/courses/my/<int:student_id>", methods=["GET"])
def get_my_courses(student_id):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT 
            c.id,
            c.code,
            c.name,
            c.time,
            c.instructor,
            c.capacity,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_count
        FROM enrollments en
        JOIN courses c ON en.course_id = c.id
        WHERE en.student_id = ?
    """, (student_id,))

    rows = []
    for row in cur.fetchall():
        row = dict(row)
        rows.append({
            "id": row["id"],
            "code": row["code"],
            "name": row["name"],
            "instructor": row["instructor"],
            "time": row["time"],
            "students_enrolled": row["enrolled_count"],
            "capacity": row.get("capacity") or 50,
            "enrollment_display": f"{row['enrolled_count']}/{row.get('capacity') or 50}"
        })

    return jsonify(rows)


# -----------------------------
# Get all available courses with enrollment info
# -----------------------------
@bp.route("/student/courses/available", methods=["GET"])
def get_available_courses():
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT 
            c.id,
            c.code,
            c.name,
            c.time,
            c.instructor,
            c.capacity,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_count
        FROM courses c
    """)

    rows = []
    for row in cur.fetchall():
        row = dict(row)
        enrolled_count = row["enrolled_count"]
        capacity = row.get("capacity") or 50  # default capacity if column missing
        rows.append({
            "id": row["id"],
            "code": row["code"],
            "name": row["name"],
            "instructor": row["instructor"],
            "time": row["time"],
            "students_enrolled": enrolled_count,
            "is_full": 1 if enrolled_count >= capacity else 0,
            "enrollment_display": f"{enrolled_count}/{capacity}"
        })

    return jsonify(rows)


# -----------------------------
# Enroll a student in a course (with capacity check)
# -----------------------------
import random

@bp.route("/student/enroll", methods=["POST"])
def enroll():
    data = request.get_json()
    student_id = data["student_id"]
    course_id = data["course_id"]

    db = get_db()
    cur = db.cursor()

    # Already enrolled check
    cur.execute("SELECT id FROM enrollments WHERE student_id=? AND course_id=?", 
                (student_id, course_id))
    if cur.fetchone():
        return jsonify({"error": "Already enrolled"}), 400

    # Capacity check
    cur.execute("""
        SELECT capacity, (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=?) AS enrolled_count
        FROM courses
        WHERE id=?
    """, (course_id, course_id))
    course = cur.fetchone()
    if not course:
        return jsonify({"error": "Course not found"}), 404

    if course["enrolled_count"] >= course["capacity"]:
        return jsonify({"error": "Course is full"}), 400

    # Assign random numeric grade (50–100)
    initial_grade = random.randint(50, 100)

    # Insert enrollment with numeric grade
    cur.execute(
        "INSERT INTO enrollments (student_id, course_id, grade) VALUES (?, ?, ?)",
        (student_id, course_id, initial_grade)
    )
    db.commit()

    return jsonify({"message": "Successfully enrolled!", "initial_grade": initial_grade})

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