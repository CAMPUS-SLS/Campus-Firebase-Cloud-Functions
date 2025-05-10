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

//Sponsors Function Chap4-AR-ADMIN
const { getSponsors } = require("./src/triggers/http/sponsors");
const { addSponsor } = require("./src/triggers/http/sponsors");
const { updateSponsor } = require("./src/triggers/http/sponsors");
const { deleteSponsor } = require("./src/triggers/http/sponsors");

//Announcements Functions CHAP4-AR-ADMIN
const { getAnnouncements } = require("./src/triggers/http/announcements");
const { deleteAnnouncements } = require("./src/triggers/http/announcements");
const { getAnnouncementCategories } = require("./src/triggers/http/announcements");
const { createAnnouncement } = require("./src/triggers/http/announcements");
const { addAnnouncementCategory } = require("./src/triggers/http/announcements");
const { updateAnnouncement } = require("./src/triggers/http/announcements");
const { archiveAnnouncement } = require("./src/triggers/http/announcements");

//DocumentRequest
const { getDocumentRequests } = require("./src/triggers/http/documentrequest");

//AUTH FOR STAFF
const { loginStaff } = require("./src/triggers/http/loginStaff");
const { registerStaff } = require("./src/triggers/http/registerStaff");
const { verifyStaff } = require("./src/triggers/http/verifyStaff");
const { getAllStaffVerification } = require("./src/triggers/http/getAllStaffVerification");

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

exports.getSponsors = getSponsors;
exports.addSponsor = addSponsor;
exports.updateSponsor = updateSponsor;
exports.deleteSponsor = deleteSponsor;

exports.getAnnouncements = getAnnouncements;
exports.deleteAnnouncements = deleteAnnouncements;
exports.getAnnouncementCategories = getAnnouncementCategories;
exports.createAnnouncement = createAnnouncement;
exports.addAnnouncementCategory = addAnnouncementCategory;
exports.updateAnnouncement = updateAnnouncement;
exports.archiveAnnouncement = archiveAnnouncement;

exports.getDocumentRequests = getDocumentRequests;

// You can add more functions as you develop them
// Example:
// exports.anotherFunction = require('./path/to/file').functionName;

console.log('Firebase Functions initialized');