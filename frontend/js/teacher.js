const API_BASE = "http://localhost:5000/api";

function $(id) { return document.getElementById(id); }

// Simple API helper
async function api(endpoint) {
  const res = await fetch(API_BASE + endpoint);
  return res.json();
}

// Load teacher's courses
async function loadTeacherCourses() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/pages/login.html";
    return;
  }

  $("welcome").textContent = `Welcome Dr. ${user.username}!`;

  const teacherId = user.id;

  // Fetch this teacher’s courses
  const courses = await api(`/teacher/courses/${teacherId}`);

  const div = $("courses");
  div.innerHTML = `
    <table class="course-table">
      <tr>
        <th>Course</th>
        <th>Time</th>
        <th>Students Enrolled</th>
      </tr>
    </table>
  `;

  const table = div.querySelector("table");

  courses.forEach(c => {
    table.innerHTML += `
      <tr onclick="loadStudents(${c.course_id}, '${c.course_name}')">
        <td class="clickable">${c.course_name}</td>
        <td>${c.time}</td>
        <td>${c.enrolled}/${c.capacity}</td>
      </tr>
    `;
  });
}



// Load students for selected course
async function loadStudents(courseId, courseName) {
  const students = await api(`/teacher/course/${courseId}/students`);

  const div = $("students");
  div.innerHTML = `
    <h2>Students in ${courseName}</h2>
    <table class="course-table">
      <tr>
        <th>Student</th>
        <th>Grade</th>
        <th>Update</th>
      </tr>
    </table>
  `;

  const table = div.querySelector("table");

  students.forEach(s => {
    table.innerHTML += `
      <tr>
        <td>${s.username}</td>
        <td><input id="g-${s.enrollment_id}" value="${s.grade || ""}"></td>
        <td>
          <button onclick="updateGrade(${s.enrollment_id})">Save</button>
        </td>
      </tr>
    `;
  });
}



async function updateGrade(enrollmentId) {
  const grade = $("g-" + enrollmentId).value;

  await fetch(API_BASE + "/teacher/grade", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      enrollment_id: enrollmentId,
      grade: grade
    })
  });

  alert("Grade updated!");
}


// Init
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/pages/login.html";
    return;
  }

  // SET TEACHER ID
  window.TEACHER_ID = user.id;
  $("welcome").textContent = `Welcome Dr. ${user.username}!`;

  // SIGN OUT
  $("logoutBtn").onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  };

  // Load courses
  loadTeacherCourses();
});
