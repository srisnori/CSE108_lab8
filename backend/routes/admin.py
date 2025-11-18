from flask import Blueprint, g, jsonify, request
import sqlite3
from db import get_db

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/users", methods=["GET"])
def get_users():
    db = get_db()
    cur = db.execute("SELECT id, username as name, role FROM users")
    users = [dict(row) for row in cur.fetchall()]
    return jsonify(users)

@admin_bp.route("/users/<role>/<int:user_id>", methods=["PUT"])
def update_user(role, user_id):
    db = get_db()
    data = request.get_json()
    name = data.get("name")
    new_role = data.get("role")  # << get new role

    db.execute(
        "UPDATE users SET username=?, role=? WHERE id=?",
        (name, new_role, user_id)
    )
    db.commit()
    return jsonify({"success": True})

@admin_bp.route("/users/<role>/<int:user_id>", methods=["DELETE"])
def delete_user(role, user_id):
    db = get_db()
    db.execute("DELETE FROM users WHERE id=? AND role=?", (user_id, role))
    db.commit()
    return jsonify({"success": True})

@admin_bp.route("/users", methods=["POST"])
def create_user():
    db = get_db()
    data = request.get_json()
    db.execute(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        (data["name"], "1234", data["role"])
    )
    db.commit()
    return jsonify({"success": True})


@admin_bp.route("/courses", methods=["GET"])
def get_courses():
    db = get_db()
    cur = db.execute("SELECT id as course_id, name as course_name, instructor as teacher_id, time, capacity as max_capacity FROM courses")
    courses = [dict(row) for row in cur.fetchall()]
    return jsonify(courses)

import random
import string

def random_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@admin_bp.route("/courses", methods=["POST"])
def create_course():
    db = get_db()
    data = request.get_json()
    
    course_name = data.get("course_name")
    teacher_id = data.get("teacher_id")
    time = data.get("time")
    max_capacity = data.get("max_capacity", 0)
    code = data.get("code") or random_code()  # generate a code if not provided

    if not course_name:
        return jsonify({"error":"Course name required"}), 400

    db.execute(
        "INSERT INTO courses (name, code, instructor, time, capacity) VALUES (?, ?, ?, ?, ?)",
        (course_name, code, teacher_id, time, max_capacity)
    )
    db.commit()
    return jsonify({"success": True})

@admin_bp.route("/courses/<int:course_id>", methods=["PUT"])
def update_course(course_id):
    db = get_db()
    data = request.get_json()
    
    course_name = data.get("course_name")  # match JS
    teacher_id = data.get("teacher_id")    # match JS
    time = data.get("time")
    max_capacity = data.get("max_capacity", 0)

    if not course_name:                     # sanity check
        return jsonify({"error": "Course name is required"}), 400

    db.execute(
        "UPDATE courses SET name=?, instructor=?, time=?, capacity=? WHERE id=?",
        (course_name, teacher_id, time, max_capacity, course_id)
    )
    db.commit()
    return jsonify({"success": True})

@admin_bp.route("/courses/<int:course_id>", methods=["DELETE"])
def delete_course(course_id):
    db = get_db()
    db.execute("DELETE FROM courses WHERE id=?", (course_id,))
    db.commit()
    return jsonify({"success": True})


@admin_bp.route("/enrollments", methods=["GET"])
def get_enrollments():
    db = get_db()
    cur = db.execute("""
        SELECT e.student_id, u.username as student_name,
               e.course_id, c.name as course_name
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        JOIN courses c ON e.course_id = c.id
    """)
    enrollments = [dict(row) for row in cur.fetchall()]
    return jsonify(enrollments)

# Add enrollment
@admin_bp.route("/enrollments", methods=["POST"])
def create_enrollment():
    db = get_db()
    data = request.get_json()
    student_id = data.get("student_id")
    course_id = data.get("course_id")
    if not student_id or not course_id:
        return jsonify({"error": "Student ID and Course ID required"}), 400

    db.execute(
        "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
        (student_id, course_id)
    )
    db.commit()
    return jsonify({"success": True})

# Delete enrollment
@admin_bp.route("/enrollments/<int:student_id>/<int:course_id>", methods=["DELETE"])
def delete_enrollment(student_id, course_id):
    db = get_db()
    db.execute(
        "DELETE FROM enrollments WHERE student_id=? AND course_id=?",
        (student_id, course_id)
    )
    db.commit()
    return jsonify({"success": True})
