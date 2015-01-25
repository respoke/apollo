/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';

/**
 * An example Apollo plugin.
 * Put in the `./plugins` folder and it will be loaded automatically.
 *
 * @param object locals - Useful local variables from the app.
 * @param object locals.config - Server configuration settings.
 * @param object locals.clientConfig - Client configuration settings.
 * @param object locals.db - Mongoose models are attached to this object.
 * @param object locals.db.Account
 * @param object locals.db.File
 * @param object locals.db.Group
 * @param object locals.db.Message
 * @param object locals.email - Nodemailer transport instance for sending email.
 * @param object locals.respoke - An instance of Respoke that will be automatically connected.
 * @param object app - Express app instance.
 */
exports = module.exports = function (locals, app) {

    // console.log('server config', locals.config);
    // console.log('browser config', locals.clientConfig);


    // Bind any additional routes to the Express app
    app.get('/hi', function (req, res, next) {
        res.send({ message: 'Hello world' });
    });


    // Do respoke stuff
    locals.respoke.on('connect', function () {

        var msg = {
            groupId: 'Apollo',
            message: JSON.stringify({ text: 'System says: Hey there' })
        };
        console.log('Sending message');
        locals.respoke.groups.publish(msg, function (err, data) {
            if (err) {
                console.error(err);
                return;
            }
            console.log('Message was sent. Response from Respoke: ', data);
        });

    });

    // Do database queries
    locals.db.Account.count().exec(function (err, count) {
        if (err) {
            console.error(err);
            return;
        }
        console.log('There are ' + count + ' accounts.');
    });


    // Do stuff after the Express server is listening
    app.on('loaded', function () {
        console.log('Apollo loaded!');
    });

};
