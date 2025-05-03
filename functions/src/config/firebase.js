/**
 * Firebase Admin SDK Configuration
 *
 * This file sets up the Firebase Admin SDK along with Firebase Authentication,
 * Both versions of Firebase Functions (v1 and v2).
 */
const admin = require("firebase-admin");
const functions_v1 = require("firebase-functions/v1");
const functions_v2 = require("firebase-functions/v2");

//Initialize Firebase Admin
admin.initializeApp();

const function_region = 'asia-southeast1';

// Initialize Services
const auth = admin.auth();

functions_v2.setGlobalOptions({ region: function_region });


module.exports = {
  admin,
  auth,
  functions_v1: functions_v1.region(function_region),
  functions_v2,
};
