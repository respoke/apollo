'use strict';
var util = require('util');

/**
 * Removes properties from the response returned from the request library
 * that are not relevant to troubleshooting.
 *
 * @param {object} response The un-pruned response object.
 * @returns {object} The pruned response object.
 */
function pruneResponse(response) {
    var prunedResponse;

    if (!response) {
        return response;
    }

    prunedResponse = {
        headers: response.headers,
        statusCode: response.statusCode,
        body: response.body
    };

    if (!response.request) {
        return prunedResponse;
    }

    prunedResponse.request = {
        href: response.request.href,
        headers: response.request.headers
    };

    if (!response.request.body) {
        return prunedResponse;
    }

    prunedResponse.request.body = response.request.body.toString();

    return prunedResponse;
}

/**
 * Error thrown when an http request has an unexpected server response.
 *
 * @param {object} [response] the unexpected server response, included in the
 *                            error object as the 'res' property.
 * @constructor
 * @augments Error
 */
function UnexpectedServerResponseError(response) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.message = '[respoke] unexpected response from server';
    this.res = pruneResponse(response);
    this.name = 'UnexpectedServerResponseError';
}

util.inherits(UnexpectedServerResponseError, Error);

exports.UnexpectedServerResponseError = UnexpectedServerResponseError;

/**
 * Error thrown when authentication token is required.
 *
 * @constructor
 * @augments Error
 */
function NoAuthenticationTokens() {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.message = '[respoke] no authentication tokens';
    this.name = 'NoAuthenticationTokens';
}

util.inherits(NoAuthenticationTokens, Error);

exports.NoAuthenticationTokens = NoAuthenticationTokens;

/**
 * Error thrown when no endpointId is assigned and connecting as an app admin
 * using App-Token.
 *
 * @constructor
 * @augments Error
 */
function MissingEndpointIdAsAdmin() {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.message = '[respoke] no endpointId when connecting as admin';
    this.name = 'MissingEndpointIdAsAdmin';
}

util.inherits(MissingEndpointIdAsAdmin, Error);

exports.MissingEndpointIdAsAdmin = MissingEndpointIdAsAdmin;

/**
 * Error thrown when JSON response from server fails to parse.
 *
 * @constructor
 * @augments Error
 */
function UnparseableResponse() {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.message = '[respoke] unable to parse response from server';
    this.name = 'UnparseableResponse';
}

util.inherits(UnparseableResponse, Error);

exports.UnparseableResponse = UnparseableResponse;

/**
 * Error thrown when JSON response from server fails to parse.
 *
 * @constructor
 * @augments Error
 */
function SocketErrorResponseFromServer(response, method, path) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.message = '[respoke] error returned from socket request';
    this.res = response;
    this.name = 'SocketErrorResponseFromServer';
}

util.inherits(SocketErrorResponseFromServer, Error);

exports.SocketErrorResponseFromServer = SocketErrorResponseFromServer;
