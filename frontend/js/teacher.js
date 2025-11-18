// script.js

// Mock database
const users = {
  'ahepworth': {
      password: 'password123',
      name: 'Dr Hepworth',
      fullName: 'Ammon Hepworth'
  }
};

const courses = [
  {
      id: 'CS162',
      name: 'CS 162',
      teacher: 'Ammon Hepworth',
      time: 'TR 3:00-3:50 PM',
      enrolled: 4,
      students: [
          { id: 1, name: 'John Smith', grade: 'A' },
          { id: 2, name: 'Sarah Johnson', grade: 'B+' },
          { id: 3, name: 'Mike Williams', grade: 'A-' },
          { id: 4, name: 'Emily Brown', grade: 'B' }
      ]
  },
  {
      id: 'CS106',
      name: 'CS 106',
      teacher: 'Ammon Hepworth',
      time: 'MWF 2:00-2:50 PM',
      enrolled: 10,
      students: [
          { id: 5, name: 'David Lee', grade: 'A' },
          { id: 6, name: 'Jessica Davis', grade: 'B' },
          { id: 7, name: 'Chris Martinez', grade: 'A-' },
          { id: 8, name: 'Amanda Garcia', grade: 'B+' },
          { id: 9, name: 'Ryan Wilson', grade: 'C+' },
          { id: 10, name: 'Lauren Anderson', grade: 'A' },
          { id: 11, name: 'Kevin Thomas', grade: 'B-' },
          { id: 12, name: 'Michelle Taylor', grade: 'A-' },
          { id: 13, name: 'Brandon Moore', grade: 'B' },
          { id: 14, name: 'Ashley Jackson', grade: 'A' }
      ]
  }
];

let currentUser = null;
let currentCourse = null;
let editingStudentId = null;

function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const error = document.getElementById('loginError');

  if (users[username] && users[username].password === password) {
      currentUser = users[username];
      error.classList.remove('active');
      showDashboard();
  } else {
      error.classList.add('active');
  }
}

function logout() {
  currentUser = null;
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('dashboard').classList.remove('active');
  document.getElementById('username').value = 'ahepworth';
  document.getElementById('password').value = 'password123';
}

function showDashboard() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboard').classList.add('active');
  document.getElementById('teacherName').textContent = currentUser.name;
  loadCourses();
}

function loadCourses() {
  const coursesTable = document.getElementById('coursesTable');
  coursesTable.innerHTML = '';

  courses.forEach(course => {
      const row = document.createElement('tr');
      row.innerHTML = `
          <td><span class="course-link" onclick="viewCourse('${course.id}')">${course.name}</span></td>
          <td>${course.teacher}</td>
          <td>${course.time}</td>
          <td>${course.students.length}/${course.enrolled}</td>
      `;
      coursesTable.appendChild(row);
  });
}

function viewCourse(courseId) {
  currentCourse = courses.find(c => c.id === courseId);
  document.getElementById('coursesSection').style.display = 'none';
  document.getElementById('studentsSection').classList.add('active');
  document.getElementById('courseTitle').textContent = currentCourse.name;
  loadStudents();
}

function loadStudents() {
  const studentsTable = document.getElementById('studentsTable');
  studentsTable.innerHTML = '';

  currentCourse.students.forEach(student => {
      const row = document.createElement('tr');
      row.id = `student-${student.id}`;
      row.innerHTML = `
          <td>${student.name}</td>
          <td id="grade-${student.id}">${student.grade}</td>
          <td>
              <button class="edit-btn" onclick="editGrade(${student.id})">Edit Grade</button>
          </td>
      `;
      studentsTable.appendChild(row);
  });
}

function editGrade(studentId) {
  if (editingStudentId !== null) {
      cancelEdit(editingStudentId);
  }

  editingStudentId = studentId;
  const student = currentCourse.students.find(s => s.id === studentId);
  const gradeCell = document.getElementById(`grade-${studentId}`);
  const row = document.getElementById(`student-${studentId}`);
  
  gradeCell.innerHTML = `<input type="text" class="grade-input" id="grade-input-${studentId}" value="${student.grade}">`;
  row.children[2].innerHTML = `
      <button class="save-btn" onclick="saveGrade(${studentId})">Save</button>
      <button class="cancel-btn" onclick="cancelEdit(${studentId})">Cancel</button>
  `;
}

function saveGrade(studentId) {
  const newGrade = document.getElementById(`grade-input-${studentId}`).value;
  const student = currentCourse.students.find(s => s.id === studentId);
  student.grade = newGrade;
  editingStudentId = null;
  loadStudents();
}

function cancelEdit(studentId) {
  editingStudentId = null;
  loadStudents();
}

function backToCourses() {
  document.getElementById('studentsSection').classList.remove('active');
  document.getElementById('coursesSection').style.display = 'block';
  currentCourse = null;
  editingStudentId = null;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('password').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
          login();
      }
  });
});