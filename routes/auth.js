var express = require('express');
var router = express.Router();
var passport = require('passport');

router.delete('/session', function (req, res) {
    req.logout();
    res.send({ message: 'Logged out' });
});

// Local auth is over JSON
router.post('/local', passport.authenticate('local'), function (req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    res.send(req.user);
});

module.exports = router;
