const API_BASE = "http://localhost:5000/api";
let currentTab = "myCourses";
let myCoursesData = [];

function $(id) { return document.getElementById(id); }

function showMessage(type, msg) {
  const box = $("messageBox");
  box.textContent = msg;
  box.className = "message " + type;
  box.classList.remove("hidden");
  setTimeout(() => box.classList.add("hidden"), 4000);
}

async function api(endpoint, method="GET", body=null) {
  try {
    const res = await fetch(API_BASE + endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : null
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  } catch (err) {
    console.error(err);
    showMessage("error", err.message);
    return null;
  }
}

function fetchMyCourses() {
  return api(`/student/courses/my/${window.STUDENT_ID}`);
}

function fetchAllCourses() {
  return api(`/student/courses/available`);
}

async function enrollCourse(courseId) {
  const r = await api("/student/enroll", "POST", {
    student_id: window.STUDENT_ID,
    course_id: courseId
  });

  if (r) {
    showMessage("success", r.message);
    renderContent();
  }
}

async function unenrollCourse(courseId) {
  const r = await api("/student/unenroll", "POST", {
    student_id: window.STUDENT_ID,
    course_id: courseId
  });

  if (r) {
    showMessage("success", r.message);
    renderContent();
  }
}

function renderMyCoursesTable(courses) {
  const body = $("myCoursesTableBody");
  body.innerHTML = "";

  if (!courses || courses.length === 0) {
    body.innerHTML = `<tr><td colspan="4" class="empty">You are not currently enrolled in any classes.</td></tr>`;
    return;
  }

  courses.forEach(c => {
    body.innerHTML += `
      <tr>
        <td>${c.course_name}</td>
        <td>${c.teacher_name}</td>
        <td>${c.time}</td>
        <td><button onclick="unenrollCourse(${c.course_id})">Drop</button></td>
      </tr>
    `;
  });
}

function renderAllCoursesTable(allCourses, myCourses) {
  const body = $("allCoursesTableBody");
  body.innerHTML = "";

  const mySet = new Set(myCourses.map(x => x.course_id));

  allCourses.forEach(c => {
    const enrolled = mySet.has(c.course_id);
    const full = !!c.is_full;

    let action = "";
    if (enrolled) action = `<span class="enrolled-text">Enrolled</span>`;
    else if (full) action = `<span class="full-text">Full</span>`;
    else action = `<button onclick="enrollCourse(${c.course_id})">Add</button>`;

    body.innerHTML += `
      <tr>
        <td>${c.course_name}</td>
        <td>${c.teacher_name}</td>
        <td>${c.time}</td>
        <td>${c.enrollment_display}</td>
        <td>${action}</td>
      </tr>
    `;
  });
}

async function renderContent() {
  myCoursesData = await fetchMyCourses() || [];
  renderMyCoursesTable(myCoursesData);

  const allCourses = await fetchAllCourses() || [];
  renderAllCoursesTable(allCourses, myCoursesData);

  updateTabs();
}

function updateTabs() {
  if (currentTab === "myCourses") {
    $("myCoursesContent").classList.remove("hidden");
    $("allCoursesContent").classList.add("hidden");
  } else {
    $("allCoursesContent").classList.remove("hidden");
    $("myCoursesContent").classList.add("hidden");
  }
}

function switchTab(tab) {
  currentTab = tab;
  updateTabs();
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/pages/login.html";
    return;
  }

  window.STUDENT_ID = user.id;
  $("welcomeUser").textContent = `Welcome ${user.username}!`;

  $("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  });

  $("myCoursesTabBtn").addEventListener("click", () => switchTab("myCourses"));
  $("allCoursesTabBtn").addEventListener("click", () => switchTab("allCourses"));

  renderContent();
});