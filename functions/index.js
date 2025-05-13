/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all Cloud Functions for deployment
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const documentFilter = require('./src/triggers/http/admin/filters/Filter-Document_View-ADMIN');

// Initialize Firebase Admin
admin.initializeApp();

// Export Filter Functions with region specification
exports.filterDocumentData = functions
  .region('asia-southeast1')
  .https.onCall(async (data, context) => {
    try {
      return await documentFilter.filterDocumentData(data, context);
    } catch (error) {
      console.error('Error in filterDocumentData:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'An error occurred while filtering documents'
      );
    }
  });

console.log('Firebase Functions initialized');