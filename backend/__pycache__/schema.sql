-- Drop tables if they exist to allow for clean re-initialization
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;

-- Teachers Table
CREATE TABLE teachers (
    teacher_id INTEGER PRIMARY KEY,
    teacher_name TEXT NOT NULL
);

-- Students Table
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    student_name TEXT NOT NULL
);

-- Courses Table
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL,
    teacher_id INTEGER,
    time TEXT NOT NULL,
    max_capacity INTEGER NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers (teacher_id)
);

-- Enrollments Table (Many-to-Many relationship)
CREATE TABLE enrollments (
    student_id INTEGER,
    course_id INTEGER,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students (student_id),
    FOREIGN KEY (course_id) REFERENCES courses (course_id)
);

-- NOTE: All sample data INSERT statements are located in db.py.