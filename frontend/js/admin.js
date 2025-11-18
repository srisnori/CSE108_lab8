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
    const options = { method, headers: { "Content-Type": "application/json" } };

    const token = localStorage.getItem("admin_token");
    if (token) options.headers["Authorization"] = `Bearer ${token}`;

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(API_ROOT + endpoint, options);
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
  const logoutBtn = $("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", ()=> {
    localStorage.removeItem("user");
    localStorage.removeItem("admin_token");
    window.location.href = "/index.html";
  });
});

async function loadAll(){
  await Promise.all([ loadUsers(), loadCourses(), loadEnrollments() ]);
}

/* ----------------- USERS ----------------- */

let editingUser = null;

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
    // UPDATE user (corrected)
    const res = await api(`/users/${editingUser.role}/${editingUser.id}`, "PUT", {
      name,
      role
    });


    if (res){
      showMessage("success", "User updated");
      closeUserModal();
      loadUsers();
    }

  } else {
    // CREATE user
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
        <td>${escapeHtml(c.teacher_id ?? "")}</td>
        <td>${escapeHtml(c.time)}</td>
        <td>${c.max_capacity}</td>
        <td>
          <button class="btn" onclick="openEditCourseModal(${c.course_id}, '${escapeHtml(c.course_name)}', '${escapeHtml(c.teacher_id ?? "")}', '${escapeHtml(c.time)}', ${c.max_capacity})">Edit</button>
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

function openEditCourseModal(id, name, teacher, time, capacity){
  editingCourse = id;
  $("courseModalTitle").textContent = "Edit Course";
  $("course-name").value = unescapeHtml(name);
  $("course-teacher").value = unescapeHtml(teacher);
  $("course-time").value = unescapeHtml(time);
  $("course-capacity").value = capacity || 10;
  $("courseModal").classList.remove("hidden");
}

function closeCourseModal(){
  $("courseModal").classList.add("hidden");
  editingCourse = null;
}

async function submitCourse(){
  const name = $("course-name").value.trim();
  const teacher = $("course-teacher").value.trim() || null;
  const time = $("course-time").value.trim();
  const max_capacity = parseInt($("course-capacity").value) || 0;

  if(!name) return showMessage("error", "Course name required");

  const payload = {
    course_name: name,
    teacher_id: teacher,
    time: time,
    max_capacity: max_capacity
  };

  if(editingCourse){
    // UPDATE course
    const res = await api(`/courses/${editingCourse}`, "PUT", payload);
    if(res){
      showMessage("success","Course updated");
      closeCourseModal();
      loadCourses();
    }
  } else {
    // CREATE course
    const res = await api("/courses", "POST", payload);
    if(res){
      showMessage("success","Course added");
      closeCourseModal();
      loadCourses();
    }
  }
}

async function deleteCourse(course_id){
  if (!confirm("Delete this course?")) return;

  try {
    const res = await api(`/courses/${course_id}`, "DELETE");
    if (res && res.success) {
      showMessage("success", "Course deleted");
      loadCourses(); // refresh the table
    } else {
      showMessage("error", res?.error || "Failed to delete course");
    }
  } catch(err) {
    console.error(err);
    showMessage("error", "Failed to delete course");
  }
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

/* ----------------- helpers ----------------- */

function escapeHtml(s){
  if (!s) return "";
  return (""+s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function unescapeHtml(s){
  if (!s) return "";
  return (""+s)
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">")
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"');
}