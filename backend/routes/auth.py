from flask import Blueprint, request, jsonify
from db import get_db

bp = Blueprint("auth", __name__)

@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM users WHERE username=? AND password=?", (username, password))
    user = cur.fetchone()

    if not user:
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "role": user["role"]
    })