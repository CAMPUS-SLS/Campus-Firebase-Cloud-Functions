/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all Cloud Functions for deployment
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
const documentFilter = require('./src/triggers/http/admin/filters/Filter-Document_View-ADMIN');

// Export Filter Functions with region specification
exports.filterDocumentData = functions
  .runWith({ region: 'asia-southeast1' })
  .https.onCall(documentFilter.filterDocumentData);

console.log('Firebase Functions initialized');