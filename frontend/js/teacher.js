const user = JSON.parse(localStorage.getItem("user"));
document.getElementById("welcome").innerText = "Welcome Dr. " + user.username + "!";

fetch("http://localhost:5000/api/teacher/courses/" + user.id)
  .then(res => res.json())
  .then(data => {
    const div = document.getElementById("courses");

    data.forEach(c => {
      div.innerHTML += `
        <div>
          <a href="teachercourse.html?id=${c.id}">
            ${c.course_name}
          </a>
        </div>
      `;
    });
  });