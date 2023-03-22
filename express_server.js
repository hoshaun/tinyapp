const express = require("express");
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const userDatabase = {};

const urlDatabase = {};

app.get("/register", (req, res) => {
  const user = userDatabase[req.session.userId];

  if (user) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: user
  };

  res.render('register', templateVars);
});

app.get("/login", (req, res) => {
  const user = userDatabase[req.session.userId];

  if (user) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: user
  };

  res.render('login', templateVars);
});

app.get("/urls", (req, res) => {
  const user = userDatabase[req.session.userId];
  const urls = user ? urlsForUser(user.id, urlDatabase) : {};

  const templateVars = {
    urls: urls,
    user: user
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = userDatabase[req.session.userId];

  if (!user) {
    return res.redirect('/login');
  }

  const templateVars = {
    user: user
  };

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = userDatabase[req.session.userId];

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
  const user = userDatabase[req.session.userId];

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

  if (!(email && password) || getUserByEmail(email, userDatabase)) {
    return res.status(400).send('Status: Bad Request\n');
  }

  const newUserId = generateRandomString(10);
  const newUser = {
    id: newUserId,
    email: email,
    password: password
  };
  userDatabase[newUserId] = newUser;

  req.session.userId = newUserId;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, userDatabase);

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

app.put("/urls/:id", (req, res) => {
  const user = userDatabase[req.session.userId];
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

app.delete("/urls/:id", (req, res) => {
  const user = userDatabase[req.session.userId];
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