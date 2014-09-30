var express = require('express');
var router = express.Router();

router.get('/me', function (req, res, next) {
    res.send(req.user);
});

router.patch('/me', function (req, res, next) {
    req.db.Account.findByIdAndUpdate(req.user._id, req.body, function (err, account) {
        if (err) {
            return next(err);
        }
        res.send(account);
    });
});

router.get('/accounts/:id', function (req, res, next) {
    req.db.Account.findById(req.params.account, function (err, account) {
        if (err) {
            return next(err);
        }
        if (!account) {
            return res.status(404).send({ error: 'Account not found by id ' + req.params.id });
        }
        res.send(account);
    });
});

router.post('/accounts', function (req, res, next) {
    new req.db.Account(req.body).save(function (err, account) {
        if (err) {
            return next(err);
        }
        req.login(account, function (err) {
            if (err) {
                return next(err);
            }
            res.send(req.user);
        });
    });
});

module.exports = router;
