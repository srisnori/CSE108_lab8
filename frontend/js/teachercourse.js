const params = new URLSearchParams(window.location.search);
const id = params.get("id");

fetch("http://localhost:5000/api/teacher/course/" + id)
  .then(res => res.json())
  .then(data => {
    const div = document.getElementById("students");

    data.forEach(s => {
      div.innerHTML += `
        <div>
          ${s.username}
          <input value="${s.grade || ""}" 
            onchange="updateGrade(${s.enrollment_id}, this.value)">
        </div>
      `;
    });
  });

function updateGrade(enrollmentId, grade) {
  fetch("http://localhost:5000/api/teacher/grade", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ enrollment_id: enrollmentId, grade })
  });
}