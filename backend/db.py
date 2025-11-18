import sqlite3
import os
from flask import g

DATABASE = "acme.db"

def get_db():
    """Return a single DB connection per request."""
    if "db" not in g:
        g.db = sqlite3.connect(
            DATABASE, detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Close DB after request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db(app):
    """Create tables and insert starter demo data."""
    if os.path.exists(DATABASE):
        os.remove(DATABASE)
        print(f"Removed existing {DATABASE}")

    db = get_db()

    # Load schema.sql
    with app.open_resource("schema.sql") as f:
        db.executescript(f.read().decode("utf-8"))

    print("Database schema created successfully.")

    # Sample teachers
    teachers = [
        (1, "Susan Walker"),
        (2, "Ammon Hepworth"),
        (3, "Ralph Jenkins"),
        (4, "Dr. Emily Carter")
    ]
    db.executemany(
        "INSERT INTO teachers (teacher_id, teacher_name) VALUES (?, ?)",
        teachers,
    )

    # Students
    students = [
        (1, "Varsha"),
        (2, "Chuck"),
        (3, "Mindy"),
        (4, "David"),
    ]
    db.executemany(
        "INSERT INTO students (student_id, student_name) VALUES (?, ?)",
        students,
    )

    # Courses
    courses = [
        (101, "Physics 121", 1, "TR 11:00-11:50 AM", 10),
        (102, "CS 106", 2, "MWF 2:00-2:50 PM", 10),
        (103, "Math 101", 3, "MWF 10:00-10:50 AM", 8),
        (104, "CS 162", 2, "TR 3:00-3:50 PM", 4),
        (105, "Art History", 4, "MW 9:00-9:50 AM", 12),
    ]
    db.executemany(
        "INSERT INTO courses (course_id, course_name, teacher_id, time, max_capacity) VALUES (?, ?, ?, ?, ?)",
        courses,
    )

    # Enrollments
    enrollments = [
        (1, 101), (2, 101), (3, 101), (4, 101),
        (1, 102), (3, 102), (4, 102), (2, 102),
        (2, 103), (3, 103),
        (1, 104), (2, 104), (3, 104), (4, 104),
    ]
    db.executemany(
        "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
        enrollments,
    )

    db.commit()
    print("Sample data inserted.")
