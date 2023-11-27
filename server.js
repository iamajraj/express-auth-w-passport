const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('express-flash');
const app = express();

const users = [
  { id: 1, username: 'raj123', password: 'raj' },
  { id: 2, username: 'akmal', password: 'ak123' },
];

passport.use(
  new LocalStrategy(function (username, password, done) {
    const user = users.find((user) => user.username === username);
    if (!user) return done(null, false);
    if (user.password !== password) return done(null, false);
    done(false, user);
  })
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  const user = users.find((user) => user.id == id);
  if (!user) return done(null, false);
  done(null, user);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

function isAuthenticated(req, res, next) {
  if (!req.user) return res.redirect('/login');
  next();
}

app.get('/login', (req, res) => {
  res.render('login', {
    error: req.flash('error'),
  });
});

app.get('/pr', isAuthenticated, (req, res) => {
  res.render('user', {
    user: req.user,
  });
});

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/',
    failureFlash: 'Credentials are wrong',
  })
);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
