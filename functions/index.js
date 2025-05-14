/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all Cloud Functions for deployment
 */

const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { getApplicantsByCollegeStatus } = require('./src/triggers/http/admin/filters/Filter-Document_View-ADMIN');
const campusResultsFunctions = require('./src/triggers/http/admin/filters/Campus-Results-ADMIN');
const { setAdminClaimFunction } = require('./src/triggers/http/admin/Set-Admin-Claim');
const reservationAdminFunctions = require('./src/triggers/http/admin/filters/Reservation_View-ADMIN');
const documentAdminFunctions = require('./src/triggers/http/admin/filters/Filter-Document_View-ADMIN');

// Initialize Firebase Admin
admin.initializeApp();

// Export Get Campus Results Function with region specification
exports.getCampusResults = campusResultsFunctions.getCampusResults;

// Export Set Admin Claim Function with region specification
exports.setAdminClaim = onCall({
  region: 'asia-southeast1'
}, async (request) => {
  try {
    return await setAdminClaimFunction(request);
  } catch (error) {
    console.error('Error in setAdminClaim:', error);
    throw new onCall.HttpsError('internal', error.message || 'An error occurred while setting admin claim');
  }
});

// Export Admission Functions from Reservation_View-ADMIN.js
exports.getAdmissionApplicants = reservationAdminFunctions.getAdmissionApplicants;
exports.getAdmissionColleges = reservationAdminFunctions.getAdmissionColleges;
exports.getAdmissionPrograms = reservationAdminFunctions.getAdmissionPrograms;

// Export the new function from Filter-Document_View-ADMIN.js
exports.getApplicantsByCollegeStatus = documentAdminFunctions.getApplicantsByCollegeStatus;
exports.getStudentDocuments = documentAdminFunctions.getStudentDocuments;

console.log('Firebase Functions initialized and exports configured.');