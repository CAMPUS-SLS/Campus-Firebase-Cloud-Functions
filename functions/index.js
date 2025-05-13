/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all Cloud Functions for deployment
 */

const { https } = require('firebase-functions');
const admin = require('firebase-admin');
const documentFilter = require('./src/triggers/http/admin/filters/Filter-Document_View-ADMIN');
const applicantFilter = require('./src/triggers/http/admin/filters/Applicant_List-ADMIN');
const campusResults = require('./src/triggers/http/admin/filters/Campus-Results-ADMIN');
const { setAdminClaimFunction } = require('./src/triggers/http/admin/Set-Admin-Claim');

// Initialize Firebase Admin
admin.initializeApp();

// Export Filter Functions with region specification
exports.filterDocumentData = https.onCall({
  region: 'asia-southeast1'
}, async (data, context) => {
  try {
    return await documentFilter.filterDocumentData(data, context);
  } catch (error) {
    console.error('Error in filterDocumentData:', error);
    throw new https.HttpsError(
      'internal',
      error.message || 'An error occurred while filtering documents'
    );
  }
});

// Export Load Document Function with region specification
exports.loadDocumentData = https.onCall({
  region: 'asia-southeast1'
}, async (data, context) => {
  try {
    return await documentFilter.loadDocumentData(data, context);
  } catch (error) {
    console.error('Error in loadDocumentData:', error);
    throw new https.HttpsError(
      'internal',
      error.message || 'An error occurred while loading documents'
    );
  }
});

// Export Get Applicants Function with region specification
exports.getApplicants = https.onCall({
  region: 'asia-southeast1'
}, async (data, context) => {
  try {
    return await applicantFilter.getApplicants(data, context);
  } catch (error) {
    console.error('Error in getApplicants:', error);
    throw new https.HttpsError(
      'internal',
      error.message || 'An error occurred while retrieving applicants'
    );
  }
});

// Export Get Campus Results Function with region specification
exports.getCampusResults = https.onCall({
  region: 'asia-southeast1'
}, async (data, context) => {
  try {
    return await campusResults.getCampusResults(data, context);
  } catch (error) {
    console.error('Error in getCampusResults:', error);
    throw new https.HttpsError(
      'internal',
      error.message || 'An error occurred while retrieving campus results'
    );
  }
});

// Export Set Admin Claim Function with region specification
exports.setAdminClaim = https.onCall({
  region: 'asia-southeast1'
}, async (data, context) => {
  try {
    return await setAdminClaimFunction(data, context);
  } catch (error) {
    console.error('Error in setAdminClaim:', error);
    throw new https.HttpsError(
      'internal',
      error.message || 'An error occurred while setting admin claim'
    );
  }
});

console.log('Firebase Functions initialized');