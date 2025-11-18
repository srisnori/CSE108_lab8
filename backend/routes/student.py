from flask import Blueprint, request, jsonify
from db import get_db

# Create a Blueprint named 'student'
bp = Blueprint("student", __name__)

# --- Helper Function for Database Querying ---

def query_db(query, args=(), one=False):
    """
    Executes a database query.
    """
    db = get_db()
    cur = db.execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

# --- Student API Routes ---

@bp.route("/student/courses/available", methods=["GET"])
def get_available_courses():
    """
    GET /api/student/courses/available
    Retrieves all courses offered, including teacher name, time, and enrollment count.
    Used for the 'Add Courses' tab.
    """
    query = """
    SELECT
        c.id AS course_id,
        c.course_name,
        c.time,
        c.capacity,
        t.username AS teacher_name,
        COUNT(e.student_id) AS enrolled_count
    FROM courses c
    JOIN users t ON c.teacher_id = t.id
    LEFT JOIN enrollment e ON c.id = e.course_id
    GROUP BY c.id, c.course_name, c.time, c.capacity, t.username
    ORDER BY c.course_name;
    """

    courses = query_db(query)

    # Format the results for the frontend display
    formatted_courses = []
    for course in courses:
        formatted_courses.append({
            "course_id": course["course_id"],
            "course_name": course["course_name"],
            "teacher_name": course["teacher_name"],
            "time": course["time"],
            "capacity": course["capacity"],
            "enrolled_count": course["enrolled_count"],
            "enrollment_display": f"{course['enrolled_count']}/{course['capacity']}", 
            "is_full": course["enrolled_count"] >= course["capacity"]
        })

    return jsonify(formatted_courses)


@bp.route("/student/courses/my/<int:student_id>", methods=["GET"])
def get_my_courses(student_id):
    """
    GET /api/student/courses/my/<student_id>
    Retrieves all classes the specific student is currently enrolled in.
    Used for the 'Your Courses' tab.
    """
    query = """
    SELECT
        c.id AS course_id,
        c.course_name,
        c.time,
        c.capacity,
        t.username AS teacher_name,
        COUNT(e.student_id) AS enrolled_count
    FROM courses c
    JOIN users t ON c.teacher_id = t.id
    LEFT JOIN enrollment e ON c.id = e.course_id
    WHERE c.id IN (SELECT course_id FROM enrollment WHERE student_id = ?)
    GROUP BY c.id, c.course_name, c.time, c.capacity, t.username
    ORDER BY c.course_name;
    """
    courses = query_db(query, (student_id,))

    # Format the results
    formatted_courses = []
    for course in courses:
        formatted_courses.append({
            "course_id": course["course_id"],
            "course_name": course["course_name"],
            "teacher_name": course["teacher_name"],
            "time": course["time"],
            "enrollment_display": f"{course['enrolled_count']}/{course['capacity']}"
        })

    return jsonify(formatted_courses)


@bp.route("/student/enroll", methods=["POST"])
def enroll_in_course():
    """
    POST /api/student/enroll
    Allows a student to enroll in a course, checking capacity first.
    Expected JSON body: {"student_id": 1, "course_id": 101}
    """
    data = request.get_json()
    student_id = data.get("student_id")
    course_id = data.get("course_id")

    if not all([student_id, course_id]):
        return jsonify({"error": "Missing student_id or course_id"}), 400

    db = get_db()
    try:
        # 1. Check current enrollment and capacity
        course_check = query_db("""
            SELECT c.capacity, COUNT(e.student_id) AS enrolled_count
            FROM courses c
            LEFT JOIN enrollment e ON c.id = e.course_id
            WHERE c.id = ?
            GROUP BY c.id
        """, (course_id,), one=True)

        if course_check is None:
            return jsonify({"error": "Course not found"}), 404

        capacity = course_check["capacity"]
        enrolled = course_check["enrolled_count"]

        if enrolled >= capacity:
            return jsonify({"error": "Class is already full (reached capacity)"}), 409

        # 2. Check if the student is already enrolled (prevent duplicates)
        already_enrolled = query_db("""
            SELECT 1 FROM enrollment WHERE student_id = ? AND course_id = ?
        """, (student_id, course_id), one=True)

        if already_enrolled:
            return jsonify({"error": "Student is already enrolled in this class"}), 409

        # 3. Enroll the student
        db.execute(
            "INSERT INTO enrollment (student_id, course_id) VALUES (?, ?)",
            (student_id, course_id)
        )
        db.commit()

        return jsonify({"message": "Successfully enrolled in the course"}), 200

    except Exception as e:
        db.rollback()
        print(f"Enrollment Error: {e}")
        return jsonify({"error": "An internal database error occurred during enrollment."}), 500


@bp.route("/student/unenroll", methods=["POST"])
def unenroll_from_course():
    """
    POST /api/student/unenroll
    Allows a student to unenroll from a course.
    Expected JSON body: {"student_id": 1, "course_id": 101}
    """
    data = request.get_json()
    student_id = data.get("student_id")
    course_id = data.get("course_id")

    if not all([student_id, course_id]):
        return jsonify({"error": "Missing student_id or course_id"}), 400

    db = get_db()
    try:
        # Unenroll the student
        cur = db.execute(
            "DELETE FROM enrollment WHERE student_id = ? AND course_id = ?",
            (student_id, course_id)
        )

        # Check if any row was actually deleted
        if cur.rowcount == 0:
             return jsonify({"error": "Student was not enrolled in this class"}), 404

        db.commit()
        return jsonify({"message": "Successfully unenrolled from the course"}), 200

    except Exception as e:
        db.rollback()
        print(f"Unenrollment Error: {e}")
        return jsonify({"error": "An internal database error occurred during unenrollment."}), 500
