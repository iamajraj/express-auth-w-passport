const User = require('./models/User.model');
const Post = require('./models/Post.model');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('express-flash');
const { connectMongo } = require('./db');
const app = express();

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const user = await User.findOne({
        username: username,
      }).select(['+password']);

      if (!user) return done(null, false);
      if (!user.comparePassword(password)) return done(null, false);
      done(false, user);
    } catch (err) {
      done(err, false);
    }
  })
);
passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.find({
      _id: id,
    });
    if (!user) return done(null, false);
    done(null, user);
  } catch (er) {
    done(er, false);
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(
  session({
    secret: 'who? not me',
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

app.get('/register', (req, res) => {
  res.render('register');
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

app.get('/delete-users', async (req, res) => {
  try {
    await User.deleteMany();
    res.status(200).json({ msg: 'deleted' });
  } catch (er) {
    res.status(500).json({ error: er?.toString() });
  }
});

app.get('/delete-posts', async (req, res) => {
  try {
    await Post.deleteMany();
    res.status(200).json({ msg: 'deleted' });
  } catch (er) {
    res.status(500).json({ error: er?.toString() });
  }
});

app.get('/users', async (req, res) => {
  res.json({
    users: await User.find().populate('posts'),
  });
});

app.get('/posts', async (req, res) => {
  res.json({
    posts: await Post.find().populate('authorId'),
  });
});

app.get('/create-post', isAuthenticated, (req, res) => {
  res.render('create-post');
});

app.post('/create-post', isAuthenticated, async (req, res) => {
  try {
    const id = req.user[0]._id.toString();
    const post = await Post.create({
      authorId: id,
      ...req.body,
    });
    const user = await User.findOne({ _id: id });
    user.posts.push(post._id);
    await user.save();
    res.status(201).json({ post });
  } catch (er) {
    res.status(500).json({
      err: er?.toString(),
    });
  }
});

app.post('/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    user.password = undefined;
    req.login(user, (err) => {
      if (err) {
        return res.status(201).json({
          status: 'User created, but failed to login, Please login',
          user,
        });
      } else {
        return res.status(201).json({
          status: 'User created',
          user,
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: 'something went wrong',
    });
  }
});

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/',
    failureFlash: 'Credentials are wrong',
  })
);

connectMongo().then(() => {
  app.listen(3000, () => {
    console.log('Server listening on port 3000');
  });
});
