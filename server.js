const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'views')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// Initialize SQLite database
const db = new sqlite3.Database('./users.db');

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user','admin'))
  )
`);

db.get(`SELECT * FROM users WHERE username = 'admin'`, (err, row) => {
  if (!row) {
    db.run(
      `INSERT INTO users (first_name, last_name, username, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      ['Admin', 'User', 'admin', 'admin123', 'admin'],
      () => console.log('Admin user created: username=admin, password=admin123')
    );
  }
});

// Routes

app.get('/', (req, res) => {
  if (req.session.username) {
    res.redirect('/game');
  } else {
    res.redirect('/login');
  }
});

app.get('/signup', (req, res) => {
  if (req.session.username) return res.redirect('/game');
  res.sendFile(path.join(__dirname, 'views/Signup/signup.html'));
});

app.get('/login', (req, res) => {
  if (req.session.username) return res.redirect('/game');
  res.sendFile(path.join(__dirname, 'views/Login/login.html'));
});

app.get('/game', (req, res) => {
  if (req.session.username) {
    return res.sendFile(path.join(__dirname, 'views/Game/tic_tac_to.html'));
  }
  return res.status(401).send('Unauthorized: Please log in first.');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.clearCookie('user_info');
    res.redirect('/login');
  });
});

app.post('/signup', (req, res) => {
  const { first_name, last_name, username, password } = req.body;

  if (!first_name || !last_name || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  db.run(
    `INSERT INTO users (first_name, last_name, username, password, role) VALUES (?, ?, ?, ?, ?)`,
    [first_name, last_name, username, password, 'user'],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Username already exists.' });
      }

      req.session.username = username;
      req.session.role = 'user';

      res.cookie('user_info', JSON.stringify({
        username,
        first_name,
        last_name
      }), {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
      });

      res.redirect('/game');
    }
  );
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password.' });
  }

  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, user) => {
    if (err) {
      console.error('Database error:', err.message); req.session.username = username
      return res.status(500).json({ error: 'Internal server error.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.username = user.username;
    req.session.role = user.role;

    res.cookie('user_info', JSON.stringify({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name
    }), {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax'
    });

    res.redirect('/game');
  });
});

app.get('/users', (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ error: 'Unauthorized: Please log in.' });
  }

  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only.' });
  }

  db.all('SELECT id, first_name, last_name, username, role FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve users.' });
    }
    res.json(rows);
  });
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).send('404 Not Found: The page you are looking for does not exist.');
});

app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
