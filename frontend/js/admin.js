console.log("ADMIN JS LOADED!");

const API_ROOT = "http://localhost:5000/api/admin";

/* ----------------- helper & messages ----------------- */

function $(id){ return document.getElementById(id); }

function showMessage(type, msg){
  const box = $("messageBox");
  box.textContent = msg;
  box.className = "message " + type;
  box.classList.remove("hidden");
  setTimeout(()=> box.classList.add("hidden"), 3500);
}

async function api(endpoint, method="GET", body=null){
  try {
    const res = await fetch(API_ROOT + endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : null
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data;
  } catch(err) {
    console.error(err);
    showMessage("error", err.message);
    return null;
  }
}

/* ----------------- INITIAL LOAD ----------------- */

document.addEventListener("DOMContentLoaded", () => {
  loadAll();
  // optional: signout link
  const logoutBtn = $("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", ()=> {
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  });
});

async function loadAll(){
  await Promise.all([ loadUsers(), loadCourses(), loadEnrollments() ]);
}

/* ----------------- USERS (teachers + students) ----------------- */

let editingUser = null; // {role, id}

async function loadUsers(){
  const data = await api("/users");
  const tbody = $("users-table-body");
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No users found.</td></tr>`;
    return;
  }

  data.forEach(u => {
    tbody.innerHTML += `
      <tr>
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.role}</td>
        <td>
          <button class="btn" onclick="openEditUserModal('${u.role}', ${u.id}, '${escapeHtml(u.name)}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteUser('${u.role}', ${u.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function openUserModal(){
  editingUser = null;
  $("userModalTitle").textContent = "Add User";
  $("user-name").value = "";
  $("user-role").value = "student";
  $("userModal").classList.remove("hidden");
}

function openEditUserModal(role, id, name){
  editingUser = { role, id };
  $("userModalTitle").textContent = `Edit ${role}`;
  $("user-name").value = unescapeHtml(name);
  $("user-role").value = role;
  $("userModal").classList.remove("hidden");
}

function closeUserModal(){ $("userModal").classList.add("hidden"); editingUser = null; }

async function submitUser(){
  const name = $("user-name").value.trim();
  const role = $("user-role").value;

  if (!name) return showMessage("error", "Name required");

  if (editingUser){
    // update
    const res = await api(`/users/${editingUser.role}/${editingUser.id}`, "PUT", { name });
    if (res) {
      showMessage("success", "User updated");
      closeUserModal();
      loadUsers();
    }
  } else {
    // create
    const res = await api("/users", "POST", { name, role });
    if (res){
      showMessage("success", "User added");
      closeUserModal();
      loadUsers();
    }
  }
}

async function deleteUser(role, id){
  if (!confirm("Delete this user?")) return;
  const res = await api(`/users/${role}/${id}`, "DELETE");
  if (res){
    showMessage("success", "Deleted");
    loadUsers();
  }
}

/* ----------------- COURSES ----------------- */

let editingCourse = null;

async function loadCourses(){
  const data = await api("/courses");
  const tbody = $("courses-table-body");
  tbody.innerHTML = "";

  if (!data || data.length === 0){
    tbody.innerHTML = `<tr><td colspan="6">No courses found.</td></tr>`;
    return;
  }

  data.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>${c.course_id}</td>
        <td>${escapeHtml(c.course_name)}</td>
        <td>${c.teacher_id ?? ""}</td>
        <td>${escapeHtml(c.time)}</td>
        <td>${c.max_capacity}</td>
        <td>
          <button class="btn" onclick="openEditCourseModal(${c.course_id}, '${escapeHtml(c.course_name)}', ${c.teacher_id || 0}, '${escapeHtml(c.time)}', ${c.max_capacity})">Edit</button>
          <button class="btn btn-danger" onclick="deleteCourse(${c.course_id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function openCourseModal(){
  editingCourse = null;
  $("courseModalTitle").textContent = "Add Course";
  $("course-name").value = "";
  $("course-teacher").value = "";
  $("course-time").value = "";
  $("course-capacity").value = 10;
  $("courseModal").classList.remove("hidden");
}

function openEditCourseModal(id, name, teacher_id, time, capacity){
  editingCourse = id;
  $("courseModalTitle").textContent = "Edit Course";
  $("course-name").value = unescapeHtml(name);
  $("course-teacher").value = teacher_id || "";
  $("course-time").value = unescapeHtml(time);
  $("course-capacity").value = capacity || 10;
  $("courseModal").classList.remove("hidden");
}

function closeCourseModal(){ $("courseModal").classList.add("hidden"); editingCourse = null; }

async function submitCourse(){
  const name = $("course-name").value.trim();
  const teacher_id = parseInt($("course-teacher").value) || null;
  const time = $("course-time").value.trim();
  const max_capacity = parseInt($("course-capacity").value) || 0;

  if (!name) return showMessage("error", "Course name required");

  if (editingCourse){
    const res = await api(`/courses/${editingCourse}`, "PUT", { course_name: name, teacher_id, time, max_capacity });
    if (res){ showMessage("success", "Course updated"); closeCourseModal(); loadCourses(); }
  } else {
    const res = await api("/courses", "POST", { course_name: name, teacher_id, time, max_capacity });
    if (res){ showMessage("success", "Course added"); closeCourseModal(); loadCourses(); }
  }
}

async function deleteCourse(id){
  if (!confirm("Delete this course?")) return;
  const res = await api(`/courses/${id}`, "DELETE");
  if (res){ showMessage("success", "Deleted"); loadCourses(); loadEnrollments(); }
}

/* ----------------- ENROLLMENTS ----------------- */

async function loadEnrollments(){
  const data = await api("/enrollments");
  const tbody = $("enrollments-table-body");
  tbody.innerHTML = "";

  if (!data || data.length === 0){
    tbody.innerHTML = `<tr><td colspan="5">No enrollments found.</td></tr>`;
    return;
  }

  data.forEach(e => {
    tbody.innerHTML += `
      <tr>
        <td>${e.student_id}</td>
        <td>${escapeHtml(e.student_name)}</td>
        <td>${e.course_id}</td>
        <td>${escapeHtml(e.course_name)}</td>
        <td>
          <button class="btn btn-danger" onclick="deleteEnrollment(${e.student_id}, ${e.course_id})">Remove</button>
        </td>
      </tr>
    `;
  });
}

function openEnrollmentModal(){
  $("enroll-student-id").value = "";
  $("enroll-course-id").value = "";
  $("enrollModal").classList.remove("hidden");
}

function closeEnrollmentModal(){ $("enrollModal").classList.add("hidden"); }

async function submitEnrollment(){
  const student_id = parseInt($("enroll-student-id").value);
  const course_id = parseInt($("enroll-course-id").value);

  if (!student_id || !course_id) return showMessage("error", "Student and Course IDs required");

  const res = await api("/enrollments", "POST", { student_id, course_id });
  if (res){ showMessage("success", "Enrollment created"); closeEnrollmentModal(); loadEnrollments(); loadCourses(); }
}

async function deleteEnrollment(student_id, course_id){
  if (!confirm("Remove enrollment?")) return;
  const res = await api(`/enrollments/${student_id}/${course_id}`, "DELETE");
  if (res){ showMessage("success", "Removed"); loadEnrollments(); loadCourses(); }
}

/* ----------------- small helpers ----------------- */

function escapeHtml(s){
  if (!s) return "";
  return (""+s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function unescapeHtml(s){
  if (!s) return "";
  return (""+s).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"');
}