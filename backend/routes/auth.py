from flask import Blueprint, request, jsonify
from db import get_db

bp = Blueprint("auth", __name__)

@bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM users WHERE username=? AND password=?", (username, password))
    user = cur.fetchone()

    if user is None:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
    })