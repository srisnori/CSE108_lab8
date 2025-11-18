// student.js — all JS logic moved here (Option 1 paths expect this at /js/student.js)
const API_BASE = "/api";
let currentTab = "myCourses";
let myCoursesData = [];

/* ---------- small helpers ---------- */
function $id(id){ return document.getElementById(id); }

function showMessage(type, content){
  const box = $id("messageBox");
  box.textContent = content;
  box.className = "message " + (type === "success" ? "success" : "error");
  box.classList.remove("hidden");
  setTimeout(()=> box.classList.add("hidden"), 4000);
}

async function makeApiCall(endpoint, method="GET", body=null){
  try{
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if(body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + endpoint, opts);
    const data = await res.json().catch(()=>({ error: "Invalid JSON" }));
    if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch(err){
    console.error("API ERR", err);
    showMessage("error", err.message || String(err));
    return null;
  }
}

/* ---------- API wrappers ---------- */
function fetchMyCourses(){ return makeApiCall(`/student/courses/my/${window.STUDENT_ID}`); }
function fetchAvailableCourses(){ return makeApiCall(`/student/courses/available`); }

async function enrollCourse(courseId){
  const r = await makeApiCall("/student/enroll","POST",{ student_id: window.STUDENT_ID, course_id: courseId });
  if(r){ showMessage("success", r.message || "Enrolled"); renderContent(); }
}

async function unenrollCourse(courseId){
  const r = await makeApiCall("/student/unenroll","POST",{ student_id: window.STUDENT_ID, course_id: courseId });
  if(r){ showMessage("success", r.message || "Dropped"); renderContent(); }
}

/* ---------- renderers ---------- */
function renderMyCoursesTable(courses){
  const body = $id("myCoursesTableBody");
  body.innerHTML = "";
  if(!courses || courses.length===0){
    body.innerHTML = `<tr><td colspan="4" class="empty">You are not currently enrolled in any classes.</td></tr>`;
    return;
  }
  courses.forEach(c=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(c.course_name)}</td>
      <td>${escapeHtml(c.teacher_name || "-")}</td>
      <td>${escapeHtml(c.time || "-")}</td>
      <td><button class="drop-btn" onclick="unenrollCourse(${c.course_id})">Drop</button></td>
    `;
    body.appendChild(tr);
  });
}

function renderAllCoursesTable(allCourses, myCourses){
  const body = $id("allCoursesTableBody");
  body.innerHTML = "";
  const mySet = new Set((myCourses||[]).map(x=>x.course_id));
  if(!allCourses || allCourses.length===0){
    body.innerHTML = `<tr><td colspan="5" class="empty">No courses are currently available.</td></tr>`;
    return;
  }
  allCourses.forEach(c=>{
    const enrolled = mySet.has(c.course_id);
    const isFull = !!c.is_full;
    const enrollDisplay = c.enrollment_display || `${c.enrolled_count || 0}/${c.capacity || "-"}`;
    const action = enrolled ? `<span class="enrolled-text">Enrolled</span>` : (isFull ? `<span class="full-text">Full</span>` : `<button class="add-btn" onclick="enrollCourse(${c.course_id})">Add</button>`);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(c.course_name)}</td>
      <td>${escapeHtml(c.teacher_name || "-")}</td>
      <td>${escapeHtml(c.time || "-")}</td>
      <td>${escapeHtml(enrollDisplay)}</td>
      <td>${action}</td>
    `;
    body.appendChild(tr);
  });
}

/* ---------- utility helpers ---------- */
function escapeHtml(s){
  if(s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);});
}

/* ---------- main flow ---------- */
async function renderContent(){
  // show loaders
  $id("myCoursesLoading").classList.remove("hidden");
  $id("allCoursesLoading").classList.remove("hidden");
  $id("myCoursesContent").classList.add("hidden");
  $id("allCoursesContent").classList.add("hidden");

  myCoursesData = await fetchMyCourses() || [];
  renderMyCoursesTable(myCoursesData);
  $id("myCoursesLoading").classList.add("hidden");
  $id("myCoursesContent").classList.remove("hidden");

  const all = await fetchAvailableCourses() || [];
  renderAllCoursesTable(all, myCoursesData);
  $id("allCoursesLoading").classList.add("hidden");
  $id("allCoursesContent").classList.remove("hidden");

  updateTabDisplay();
}

function updateTabDisplay(){
  const myBtn = $id("myCoursesTabBtn"), allBtn = $id("allCoursesTabBtn");
  if(currentTab==="myCourses"){
    myBtn.classList.add("tab-active"); myBtn.classList.remove("tab-inactive");
    allBtn.classList.remove("tab-active"); allBtn.classList.add("tab-inactive");
    $id("myCoursesContent").classList.remove("hidden");
    $id("allCoursesContent").classList.add("hidden");
  } else {
    allBtn.classList.add("tab-active"); allBtn.classList.remove("tab-inactive");
    myBtn.classList.remove("tab-active"); myBtn.classList.add("tab-inactive");
    $id("allCoursesContent").classList.remove("hidden");
    $id("myCoursesContent").classList.add("hidden");
  }
}

function switchTab(tab){ currentTab = tab; renderContent(); }

document.addEventListener("DOMContentLoaded", ()=>{
  const user = JSON.parse(localStorage.getItem("user"));
  if(!user){
    window.location.href = "/pages/login.html";
    return;
  }

  $id("welcomeUser").textContent = `Welcome ${user.username}!`;
  window.STUDENT_ID = user.id;
  
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "/index.html";
    });

  $id("myCoursesTabBtn").addEventListener("click", ()=> switchTab("myCourses"));
  $id("allCoursesTabBtn").addEventListener("click", ()=> switchTab("allCourses"));

  renderContent();
});