const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const ldapStrategy = require('./SSO/ldap');
const { generateToken } = require('./SSO/helper');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

passport.use(ldapStrategy);
app.use(passport.initialize());

const options = {
    
}

app.post('/login', passport.authenticate('local', { session: true }), (req, res) => {
    // Authentication successful, generate token and return it to client
    console.log(req)
    // generateToken()
    res.json({ token: 'your_token_here' });
  });

    function isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
        return next(); // User is authenticated, so continue with the next middleware
        }
        res.status(401).json({ error: 'Unauthorized' }); // User is not authenticated, return 401 Unauthorized error
    }

    app.get('/protected-route', isAuthenticated, (req, res) => {
        // This route is protected, and only authenticated users can access it
        res.json({ message: 'You are authorized to access this route' });
    });

app.listen(3000, () => console.log('Server running on port 3000'));
