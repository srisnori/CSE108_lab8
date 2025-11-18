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

  // Use instructor name instead of ID
  const teacherName = user.username;

  // Fetch courses
  const courses = await api(`/teacher/courses/${teacherName}`);

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
        <td>${c.enrolled || 0}/${c.capacity || 50}</td>
      </tr>
    `;
  });
}

// Load students in a course
async function loadStudents(courseId, courseName) {
  const students = await api(`/teacher/course/${courseId}/students`);

  const div = $("students");
  div.innerHTML = `
    <h2>Students in ${courseName}</h2>
    <table class="course-table">
      <tr>
        <th>Student</th>
        <th>Grade (0-100)</th>
        <th>Update</th>
      </tr>
    </table>
  `;

  const table = div.querySelector("table");

  students.forEach(s => {
    table.innerHTML += `
      <tr>
        <td>${s.username}</td>
        <td><input id="g-${s.enrollment_id}" value="${s.grade || ''}"></td>
        <td>
          <button onclick="updateGrade(${s.enrollment_id})">Save</button>
        </td>
      </tr>
    `;
  });
}

async function updateGrade(enrollmentId) {
  // Get the input value and convert to a number
  const gradeInput = $("g-" + enrollmentId);
  const grade = Number(gradeInput.value);

  if (isNaN(grade) || grade < 0 || grade > 100) {
    alert("Please enter a valid number between 0 and 100.");
    return;
  }

  try {
    const res = await fetch(API_BASE + "/teacher/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollment_id: enrollmentId,
        grade: grade
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Grade updated to ${grade}!`);
      // Optionally reload students to reflect the change
      const courseRow = gradeInput.closest("tr");
      // gradeInput.value = data.grade; // optional refresh
    } else {
      alert(`Error updating grade: ${data.error || "Unknown error"}`);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to update grade. See console for details.");
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/pages/login.html";
    return;
  }

  $("welcome").textContent = `Welcome Dr. ${user.username}!`;

  $("logoutBtn").onclick = () => {
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  };

  loadTeacherCourses();
});