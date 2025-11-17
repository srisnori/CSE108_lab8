const user = JSON.parse(localStorage.getItem("user"));
document.getElementById("welcome").innerText = "Welcome " + user.username + "!";

fetch("http://localhost:5000/api/student/enrolled/" + user.id)
  .then(res => res.json())
  .then(data => {
    const div = document.getElementById("enrolled");
    data.forEach(c => {
      div.innerHTML += `<p>${c.course_name} - Grade: ${c.grade || "-"}</p>`;
    });
  });

fetch("http://localhost:5000/api/student/courses")
  .then(res => res.json())
  .then(data => {
    const div = document.getElementById("all-courses");

    data.forEach(c => {
      div.innerHTML += `
        <div class="card">
          <p>${c.course_name} (${c.course_code})</p>
          <button onclick="enroll(${c.id})">Enroll</button>
        </div>`;
    });
  });

function enroll(courseId) {
  fetch("http://localhost:5000/api/student/enroll", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ student_id: user.id, course_id: courseId })
  })
  .then(() => location.reload());
}