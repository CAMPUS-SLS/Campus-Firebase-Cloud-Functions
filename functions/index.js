/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all Cloud Functions for deployment
 */

// Import all your function modules
// const rickRollAuthTriggers = require('./triggers/auth/rickRollAuthTrigger');
// const rickRollHTTP = require('./triggers/http/rickRollCallable');


//REGISTER APPLICANT HTTP
const { registerApplicant } = require('./src/triggers/http/registerApplicant');
const { loginStudent } = require('./src/triggers/http/loginStudent');

//AUTH FOR STAFF
const { loginStaff } = require("./src/triggers/http/loginStaff");
const { registerStaff } = require("./src/triggers/http/registerStaff");
const { verifyStaff } = require("./src/triggers/http/verifyStaff");
const { getAllStaffVerification } = require("./src/triggers/http/getAllStaffVerification");

//Timeslot
const { createTimeSlot } = require("./src/triggers/http/createTimeSlot");
const { findSchedule } = require("./src/triggers/http/findSchedule");
const { getCurriculum } = require("./src/triggers/http/getCurriculum")
const { getProfessorInfo } = require("./src/triggers/http/getProfessorInfo")
const { verifyTimeAvailability } = require("./src/triggers/http/verifyTimeAvailability")
const { addCurriculum } = require("./src/triggers/http/addCurriculum")
const { getDropdownInfo } = require("./src/triggers/http/getDropdownInfo")

const { getTotalStudents } = require("./src/triggers/http/getTotalStudents")

// Export Auth Triggers
// exports.logNewUserRickRoll = rickRollAuthTriggers.logNewUserRickRoll;
// exports.logUserDeletedRickRoll = rickRollAuthTriggers.logUserDeletedRickRoll;

// Export HTTP Functions
// exports.rickRoll = rickRollHTTP.rickRoll;
exports.registerApplicant = registerApplicant;
//exports.verifyReferenceNumber = require('./triggers/http/verifyReferenceNumber').verifyReferenceNumber;
exports.loginStudent = loginStudent; 


exports.loginStaff = loginStaff;
exports.registerStaff = registerStaff;
exports.verifyStaff = verifyStaff;
exports.getAllStaffVerification = getAllStaffVerification;

exports.createTimeSlot = createTimeSlot;
exports.findSchedule = findSchedule;
exports.getCurriculum = getCurriculum;
exports.getProfessorInfo = getProfessorInfo;
exports.verifyTimeAvailability = verifyTimeAvailability;
exports.addCurriculum = addCurriculum;
exports.getDropdownInfo = getDropdownInfo;

exports.getTotalStudents = getTotalStudents;

// You can add more functions as you develop them
// Example:
// exports.anotherFunction = require('./path/to/file').functionName;

console.log('Firebase Functions initialized');