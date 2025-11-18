import sqlite3
import random
from pathlib import Path
from flask import g

DB_PATH = Path(__file__).parent / "acme.db"
SCHEMA_PATH = Path(__file__).parent / "schema.sql"

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db(app=None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Load schema
    with open(SCHEMA_PATH) as f:
        cur.executescript(f.read())

    # Insert users
    users = [
        ("sri", "1234", "student"),
        ("varsha", "1234", "student"),
        ("hari", "1234", "admin"),
        ("mahika", "1234", "student"),
        ("hepworth", "1234", "teacher"),
        ("mindy", "1234", "teacher"),
        ("sam", "1234", "teacher"),
    ]
    cur.executemany(
        "INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)", users
    )

    # Insert courses
    courses = [
        ("CSE101", "Intro to CS", "mindy", "TBD", 5),
        ("CSE162", "Data Structures", "mindy", "TBD", 5),
        ("PHYS121", "Physics 121", "hepworth", "TR 11:00-11:50 AM", 5),
        ("CS106", "Algorithms", "sam", "MWF 2:00-2:50 PM", 5),
        ("MATH101", "Calculus", "hepworth", "MWF 10:00-10:50 AM", 5),
    ]
    cur.executemany(
        "INSERT OR IGNORE INTO courses (code, name, instructor, time, capacity) VALUES (?, ?, ?, ?, ?)",
        courses
    )

    # Random enrollments with numeric grades
    cur.execute("SELECT id FROM users WHERE role='student'")
    student_ids = [row["id"] for row in cur.fetchall()]

    cur.execute("SELECT id FROM courses")
    course_ids = [row["id"] for row in cur.fetchall()]

    for student_id in student_ids:
        for course_id in course_ids:
            if random.random() < 0.5:  # 50% chance
                grade = random.randint(50, 100)
                cur.execute(
                    "INSERT INTO enrollments (student_id, course_id, grade) VALUES (?, ?, ?)",
                    (student_id, course_id, grade)
                )

    conn.commit()
    conn.close()
    print("Database initialized with users, courses, and enrollments.")
