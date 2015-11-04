var express = require('express');
var passport = require('passport');
var Strategy = require('passport-helsinki').Strategy;


// Configure the City of Helsinki OAuth 2.0 strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the SSO API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
helsinkiStrategy = new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/login/helsinki/return',
    authorizationURL: 'http://localhost:8000/oauth2/authorize/',
    tokenURL: 'http://localhost:8000/oauth2/token/',
    userProfileURL: 'http://localhost:8000/user/',
    appTokenURL: 'http://localhost:8000/jwt-token/'
  },
  function(accessToken, refreshToken, profile, cb) {
    profile.accessToken = accessToken;
    return cb(null, profile);
  });
passport.use(helsinkiStrategy);


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
  function(req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  function(req, res){
    res.render('login');
  });

app.get('/login/helsinki',
  passport.authenticate('helsinki'));

app.get('/login/helsinki/return', 
  passport.authenticate('helsinki', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res) {
    helsinkiStrategy.getAPIToken(req.user.accessToken, 'TH11btLwVBZyTCVDMshRaWMIqctoNIyy3xQBvKDD', function(token) {
      res.render('profile', { user: req.user, token: token });
    });
});

app.listen(3000);
