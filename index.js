console.clear()
require('dotenv').config()
const express     = require('express'),
    passport      = require('passport'),
    bodyParser    = require('body-parser'),
    LocalStrategy = require('passport-local'),
    session       = require('express-session'),
    { loginUser } = require('./lib/ldap'),
    cors          = require('cors'),
    store         = new session.MemoryStore;

const app = express();
const {
  PORT,
  MIDDLEWARE_SECRET
} = process.env

// app.use((req, res, next) => {
//   console.log(`${req.method} - ${req.url}`)
//   next()
// })

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());

// ref: https://www.npmjs.com/package/express-session
app.use(session({
  secret: MIDDLEWARE_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { 
    // secure: true, https requests only
    maxAge: (31 * 86400000) // 31 days
  },
  sameSite: false,
  store
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  console.log(user)
  user.findById(id, function(err, user) {
    console.log('no im not serial');
    done(err, user);
  });
  // done(null, user);
});

passport.use(new LocalStrategy(
    function(username, password, done) {
      loginUser(username, password).then((fullname) => {
        return done(null, {username, fullname})
      }).catch((err) => {
        console.log(err)
        return done(null, false)
      })
    }
  ));

app.use(
  '/',
  cors({
    origin: 'http://localhost:8080', // todo manage this via config file
    optionsSuccessStatus: 200 
  }))

app.post('/login', function(req, res, next) {

  passport.authenticate('local', function(err, user, info) {

    if (err) {
        return next(err);
    }

    if (!user) {
        return res.status(401).json({
            err: info
        });
    }

    req.logIn(user, function(err) {

        if (err) {
            return res.status(500).json({
                err: 'Could not log in user'
            });
        }
        req.session.authenticated   = true
        // console.log(user)
        res.status(200).json({
            status: 'Login successful!',
            user
        });

    });
  })(req, res, next);
});

const isAuthenticated = function(req, res, next){
  // console.log(req.session.cookie._expires > new Date())
  if(req.session && req.session.cookie && req.session.cookie._expires > new Date())
     return next();
  else
     return res.status(401).json({
       error: 'User not authenticated'
     })

}

app.get('/check', isAuthenticated, function(req, res){
  res.status(200).json({
      status: 'Login successful!'
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`)
});