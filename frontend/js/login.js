function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("http://127.0.0.1:5000/api/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      localStorage.setItem("user", JSON.stringify(data));

      if (data.role === "student") {
        window.location.href = "pages/student.html";
      } else if (data.role === "teacher") {
        window.location.href = "pages/teacher.html";
      }
    }
  });
}