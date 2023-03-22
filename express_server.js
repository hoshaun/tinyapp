const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const users = {};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

app.get("/register", (req, res) => {
  const user = users[req.session.userId];

  if (user) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: user
  };

  res.render('register', templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.session.userId];

  if (user) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: user
  };

  res.render('login', templateVars);
});

app.get("/urls", (req, res) => {
  const user = users[req.session.userId];
  const urls = user ? urlsForUser(user.id) : {};

  const templateVars = {
    urls: urls,
    user: user
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.userId];

  if (!user) {
    return res.redirect('/login');
  }

  const templateVars = {
    user: user
  };

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.session.userId];

  if (!user) {
    return res.status(401).send('Action unauthorized. Must be logged in to continue.\n');
  }

  if (urlDatabase[req.params.id].userID !== user.id) {
    return res.status(401).send('Action unauthorized. You do not have access to this resource.\n');
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: user
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;

  if (!longURL) {
    return res.status(404).send('Resource not found.\n');
  }

  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const user = users[req.session.userId];

  if (!user) {
    return res.status(401).send('Action unauthorized. Must be logged in to continue.\n');
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: user.id,
  };

  res.redirect(`/urls/${shortURL}`);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);

  if (!(email && password) || getUserByEmail(email)) {
    return res.status(400).send('Status: Bad Request\n');
  }

  const newUserId = generateRandomString(10);
  const newUser = {
    id: newUserId,
    email: email,
    password: password
  };
  users[newUserId] = newUser;

  req.session.userId = newUserId;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  if (!(user && bcrypt.compareSync(password, user.password))) {
    return res.status(403).send('Status: Incorrect Email or Password\n');
  }

  req.session.userId = user.id;
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.session.userId];
  const url = urlDatabase[req.params.id];

  if (!url) {
    return res.status(404).send('Resource not found.\n');
  }

  if (!user) {
    return res.status(401).send('Action unauthorized. Must be logged in to continue.\n');
  }

  if (url.userID !== user.id) {
    return res.status(401).send('Action unauthorized. You do not have access to this resource.\n');
  }

  url.longURL = req.body.longURL;
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.session.userId];
  const url = urlDatabase[req.params.id];

  if (!url) {
    return res.status(404).send('Resource not found.\n');
  }

  if (!user) {
    return res.status(401).send('Action unauthorized. Must be logged in to continue.\n');
  }

  if (url.userID !== user.id) {
    return res.status(401).send('Action unauthorized. You do not have access to this resource.\n');
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = function(length) {
  const charSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charSet.length);
    randomStr += charSet[randomIndex];
  }
  return randomStr;
};

const getUserByEmail = function(email) {
  for (const id in users) {
    if (users[id].email === email) {
      return users[id];
    }
  }
  return null;
};

const urlsForUser = function(id) {
  const urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
};