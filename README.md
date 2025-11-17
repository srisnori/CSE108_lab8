# CSE108_lab8

## 🚀 Running the Backend

open two terminals: 

terminal 1: 

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

terminal 2:
```bash
cd frontend
python3 -m http.server 5500
```

INSERT INTO users (username, password, role) VALUES
('sri','1234','student'),
('hari','1234','admin'),
('varsha','1234','student'),
('mahika', '1234', 'admin'),
('hepworth','1234','teacher');
