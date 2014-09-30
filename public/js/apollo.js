var apollo = angular.module('apollo', ['ngRoute']);

var restFactory = require('./rest-factory.js');
restFactory(apollo);
