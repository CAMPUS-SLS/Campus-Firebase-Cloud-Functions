/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all Cloud Functions for deployment
 */

const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const documentFilter = require('./src/triggers/http/admin/filters/Filter-Document_View-ADMIN');
const campusResults = require('./src/triggers/http/admin/filters/Campus-Results-ADMIN');
const { setAdminClaimFunction } = require('./src/triggers/http/admin/Set-Admin-Claim');
const { getAdmissionApplicants, getAdmissionColleges, getAdmissionPrograms } = require('./src/triggers/http/admin/filters/Reservation_View-ADMIN');

// Initialize Firebase Admin
admin.initializeApp();

// Export Filter Functions with region specification
exports.filterDocumentData = onCall({
  region: 'asia-southeast1'
}, async (request) => {
  try {
    return await documentFilter.filterDocumentData(request.data, request);
  } catch (error) {
    console.error('Error in filterDocumentData:', error);
    throw new Error(error.message || 'An error occurred while filtering documents');
  }
});

// Export Load Document Function with region specification
exports.loadDocumentData = onCall({
  region: 'asia-southeast1'
}, async (request) => {
  try {
    return await documentFilter.loadDocumentData(request.data, request);
  } catch (error) {
    console.error('Error in loadDocumentData:', error);
    throw new Error(error.message || 'An error occurred while loading documents');
  }
});

// Export Get Campus Results Function with region specification
exports.getCampusResults = onCall({
  region: 'asia-southeast1'
}, async (request) => {
  try {
    return await campusResults.getCampusResults(request.data, request);
  } catch (error) {
    console.error('Error in getCampusResults:', error);
    throw new Error(error.message || 'An error occurred while retrieving campus results');
  }
});

// Export Set Admin Claim Function with region specification
exports.setAdminClaim = onCall({
  region: 'asia-southeast1'
}, async (request) => {
  try {
    return await setAdminClaimFunction(request.data, request);
  } catch (error) {
    console.error('Error in setAdminClaim:', error);
    throw new Error(error.message || 'An error occurred while setting admin claim');
  }
});

// Export Admission Functions with region specification
exports.getAdmissionApplicants = onCall({
  region: 'asia-southeast1'
}, async (request) => {
  try {
    return await getAdmissionApplicants(request);
  } catch (error) {
    console.error('Error in getAdmissionApplicants:', error);
    throw new Error(error.message || 'An error occurred while retrieving admission applicants');
  }
});

exports.getAdmissionColleges = onCall({
  region: 'asia-southeast1'
}, async (request) => {
  try {
    return await getAdmissionColleges(request);
  } catch (error) {
    console.error('Error in getAdmissionColleges:', error);
    throw new Error(error.message || 'An error occurred while retrieving admission colleges');
  }
});

exports.getAdmissionPrograms = onCall({
  region: 'asia-southeast1'
}, async (request) => {
  try {
    return await getAdmissionPrograms(request);
  } catch (error) {
    console.error('Error in getAdmissionPrograms:', error);
    throw new Error(error.message || 'An error occurred while retrieving admission programs');
  }
});

console.log('Firebase Functions initialized');