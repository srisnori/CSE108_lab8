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
    db.execute("UPDATE users SET username=? WHERE id=? AND role=?", (name, user_id, role))
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