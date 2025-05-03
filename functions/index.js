/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all Cloud Functions for deployment
 */

// Import all your function modules
const rickRollAuthTriggers = require('./triggers/auth/rickRollAuthTrigger');
const rickRollHTTP = require('./triggers/http/rickRollCallable');

// Export Auth Triggers
exports.logNewUserRickRoll = rickRollAuthTriggers.logNewUserRickRoll;
exports.logUserDeletedRickRoll = rickRollAuthTriggers.logUserDeletedRickRoll;

// Export HTTP Functions
exports.rickRoll = rickRollHTTP.rickRoll;

// You can add more functions as you develop them
// Example:
// exports.anotherFunction = require('./path/to/file').functionName;

console.log('Firebase Functions initialized');