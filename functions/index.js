/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all Cloud Functions for deployment
 */

// Import all your function modules
// const rickRollAuthTriggers = require('./triggers/auth/rickRollAuthTrigger');
// const rickRollHTTP = require('./triggers/http/rickRollCallable');


//REGISTER APPLICANT HTTP



const { submitDocumentRequest } = require('./src/triggers/http/submitDocumentRequest');
const { getColleges    } = require('./src/triggers/http/getColleges');
const { getDepartments } = require('./src/triggers/http/getDepartments');

const { getSponsorPerks   } = require('./src/triggers/http/getSponsorPerks');

const { getAlumniProfile } = require("./src/triggers/http/getAlumniProfile");
const { loginAlumni } = require('./src/triggers/http/loginAlumni');
const { getSidebarUser } = require('./src/triggers/http/getSidebarUser');
const { verifyAlumni } = require("./src/triggers/http/verifyAlumni");
const { submitAlumniCardApplication } = require("./src/triggers/http/submitAlumniCardApplication");


// Export Auth Triggers
// exports.logNewUserRickRoll = rickRollAuthTriggers.logNewUserRickRoll;
// exports.logUserDeletedRickRoll = rickRollAuthTriggers.logUserDeletedRickRoll;

// Export HTTP Functions
// exports.rickRoll = rickRollHTTP.rickRoll;


exports.getAlumniProfile = getAlumniProfile;

exports.submitDocumentRequest = submitDocumentRequest;
exports.getColleges    = getColleges;
exports.getDepartments = getDepartments;
exports.loginAlumni = loginAlumni;
exports.verifyAlumni = verifyAlumni;
exports.submitAlumniCardApplication = submitAlumniCardApplication;


exports.getSidebarUser = getSidebarUser;
exports.getSponsorPerks = getSponsorPerks;


// You can add more functions as you develop them
// Example:
// exports.anotherFunction = require('./path/to/file').functionName;

console.log('Firebase Functions initialized');