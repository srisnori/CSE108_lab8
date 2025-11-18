import sqlite3
import os

# Define the path to the SQLite database file
DATABASE = 'acme.db'

def get_db():
    """
    Establishes a connection to the database.
    """
    db = sqlite3.connect(
        DATABASE,
        detect_types=sqlite3.PARSE_DECLTYPES
    )
    # Configure the connection to return rows as dictionaries (sqlite3.Row objects)
    db.row_factory = sqlite3.Row
    return db

def init_db(app):
    """
    Initializes the database schema and loads sample data.
    """
    # Check if the database file exists. If it does, delete it to start fresh for demo purposes.
    if os.path.exists(DATABASE):
        os.remove(DATABASE)
        print(f"Removed existing {DATABASE}")

    db = get_db()

    # 1. Create Tables
    with app.open_resource('schema.sql', mode='r') as f:
        db.executescript(f.read().decode('utf8'))
    
    print("Database schema created successfully.")

    # 2. Insert Sample Data
    
    # Teachers
    teachers = [
        (1, 'Susan Walker'),
        (2, 'Ammon Hepworth'),
        (3, 'Ralph Jenkins'),
        (4, 'Dr. Emily Carter')
    ]
    db.executemany('INSERT INTO teachers (teacher_id, teacher_name) VALUES (?, ?)', teachers)

    # Students
    # Note: We are mocking student_id=1 as the current logged-in user (e.g., Varsha/Chuck)
    students = [
        (1, 'Varsha'),
        (2, 'Chuck'),
        (3, 'Mindy'),
        (4, 'David')
    ]
    db.executemany('INSERT INTO students (student_id, student_name) VALUES (?, ?)', students)
    
    # Courses (course_id, course_name, teacher_id, time, max_capacity)
    courses = [
        (101, 'Physics 121', 1, 'TR 11:00-11:50 AM', 10),  # Susan Walker
        (102, 'CS 106', 2, 'MWF 2:00-2:50 PM', 10),      # Ammon Hepworth
        (103, 'Math 101', 3, 'MWF 10:00-10:50 AM', 8),    # Ralph Jenkins
        (104, 'CS 162', 2, 'TR 3:00-3:50 PM', 4),        # Ammon Hepworth (Will be Full)
        (105, 'Art History', 4, 'MW 9:00-9:50 AM', 12)    # Dr. Emily Carter
    ]
    db.executemany('INSERT INTO courses (course_id, course_name, teacher_id, time, max_capacity) VALUES (?, ?, ?, ?, ?)', courses)

    # Enrollments (student_id, course_id)
    # Student ID 1 (Varsha) is enrolled in 101, 102
    enrollments = [
        # Enrollment for Physics 121 (Course 101)
        (1, 101), (2, 101), (3, 101), (4, 101), (2, 101), 

        # Enrollment for CS 106 (Course 102)
        (1, 102), (3, 102), (4, 102), (2, 102), 
        
        # Enrollment for Math 101 (Course 103)
        (2, 103), (3, 103), 

        # Enrollment for CS 162 (Course 104) - FULL
        (1, 104), (2, 104), (3, 104), (4, 104) 
    ]
    db.executemany('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', enrollments)
    
    db.commit()
    print("Sample data inserted.")

# --- Required utility function for Flask context ---

def close_db(e=None):
    """
    Closes the database connection at the end of a request.
    """
    db = get_db()
    if db is not None:
        db.close()

def init_app(app):
    """
    Registers the close_db function with the Flask app.
    """
    app.teardown_appcontext(close_db)