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
const { generateStudentScheduleData } = require("./src/triggers/http/generateStudentScheduleData");

//FOR LIBRARY
const { getAllBooks } = require('./src/triggers/http/getAllBooks');
const { addSavedBooks } = require('./src/triggers/http/addSavedBooks');
const { removeSavedBooks } = require('./src/triggers/http/removeSavedBooks');
const { getAllSavedBooks } = require('./src/triggers/http/getAllSavedBooks');
const { getAllBooksAdmin } = require('./src/triggers/http/getAllBooksAdmin');
const { addBook } = require('./src/triggers/http/addBook');
const { deleteBook } = require('./src/triggers/http/deleteBook');
const { updateBook } = require('./src/triggers/http/updateBook');
const { getStudentCourses } = require('./src/triggers/http/getStudentCourses');

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
exports.generateStudentScheduleData = generateStudentScheduleData;

//FOR LIBRARY
exports.getAllBooks = getAllBooks;
exports.addSavedBooks = addSavedBooks;
exports.removeSavedBooks = removeSavedBooks;
exports.getAllSavedBooks = getAllSavedBooks;
exports.getAllBooksAdmin = getAllBooksAdmin;
exports.addBook = addBook;
exports.deleteBook = deleteBook;
exports.updateBook = updateBook;
exports.getStudentCourses = getStudentCourses;

// You can add more functions as you develop them
// Example:
// exports.anotherFunction = require('./path/to/file').functionName;

console.log('Firebase Functions initialized');