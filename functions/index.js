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
const { insertPersonalInfo } = require('./src/triggers/http/insertPersonalInfo'); 
const { insertAcademicBackground }  = require('./src/triggers/http/insertAcademicBackground');
const { getAcademicBackground }  = require('./src/triggers/http/getAcademicBackground');
const { insertParentGuardianInfo } = require('./src/triggers/http/insertParentGuardianInfo');

//APPLICANT INFORMATION
const { getAllPersonalInformation } = require('./src/triggers/http/getAllPersonalInformation');
const { getParentGuardianInfo } = require('./src/triggers/http/getParentGuardianInfo');
const { insertGradesForm } = require('./src/triggers/http/insertGradesForm');
const { getGradesForm } = require('./src/triggers/http/getGradesForm');
const { getStudentMLInputs } = require('./src/triggers/http/getStudentMLInputs');
const { getAllStudentMLInputs } = require('./src/triggers/http/getAllStudentMLInputs');
const { storePredictionResults } = require('./src/triggers/http/storePredictionResults');
const { getAllProspectsWithPredictions } = require('./src/triggers/http/getAllProspectsWithPredictions');
const { insertAlumniRelativeInfo } = require('./src/triggers/http/insertAlumniRelativeInfo');
const { getAlumniRelativeInfo } = require('./src/triggers/http/getAlumniRelativeInfo');
const { insertProgramPreferences } = require('./src/triggers/http/insertProgramPreferences');
const { getProgramPreferences } = require('./src/triggers/http/getProgramPreferences');
const { getApplicantAcademicBackground } = require('./src/triggers/http/getApplicantAcademicBackground');


//AUTH FOR STAFF
const { loginStaff } = require("./src/triggers/http/loginStaff");
const { registerStaff } = require("./src/triggers/http/registerStaff");
const { verifyStaff } = require("./src/triggers/http/verifyStaff");
const { getAllStaffVerification } = require("./src/triggers/http/getAllStaffVerification");
const { generateStudentScheduleData } = require("./src/triggers/http/generateStudentScheduleData");

//EVALUATION
const { saveEvaluationForm } = require("./src/triggers/http/saveEvaluationForm");
const { getEvaluationForm } = require("./src/triggers/http/getEvaluationForm");
const { submitEvaluationResponse } = require("./src/triggers/http/submitEvaluationResponse");
const { getUniversityByAdmin } = require("./src/triggers/http/getUniversityByAdmin");
const { getFacultyListForStudent } = require("./src/triggers/http/getFacultyListForStudent");
const { exportStudentEvaluation } = require("./src/triggers/http/exportStudentEvaluation");

// Export Auth Triggers
// exports.logNewUserRickRoll = rickRollAuthTriggers.logNewUserRickRoll;
// exports.logUserDeletedRickRoll = rickRollAuthTriggers.logUserDeletedRickRoll;

// Export HTTP Functions
// exports.rickRoll = rickRollHTTP.rickRoll;
exports.registerApplicant = registerApplicant;
//exports.verifyReferenceNumber = require('./triggers/http/verifyReferenceNumber').verifyReferenceNumber;
exports.loginStudent = loginStudent; 
exports.getAllPersonalInformation = getAllPersonalInformation;
exports.insertPersonalInfo = insertPersonalInfo; 
exports.insertAcademicBackground   = insertAcademicBackground;
exports.insertParentGuardianInfo = insertParentGuardianInfo;
exports.getParentGuardianInfo = getParentGuardianInfo;
exports.insertGradesForm = insertGradesForm;
exports.getGradesForm = getGradesForm;
exports.getStudentMLInputs = getStudentMLInputs;
exports.getAllStudentMLInputs = getAllStudentMLInputs;
exports.storePredictionResults = storePredictionResults;
exports.getAllProspectsWithPredictions = getAllProspectsWithPredictions;
exports.insertAlumniRelativeInfo = insertAlumniRelativeInfo;
exports.getAlumniRelativeInfo = getAlumniRelativeInfo;
exports.insertProgramPreferences = insertProgramPreferences;
exports.getProgramPreferences = getProgramPreferences;
exports.getApplicantAcademicBackground = getApplicantAcademicBackground;


exports.loginStaff = loginStaff;
exports.registerStaff = registerStaff;
exports.verifyStaff = verifyStaff;
exports.getAllStaffVerification = getAllStaffVerification;
exports.saveEvaluationForm = saveEvaluationForm;
exports.getEvaluationForm = getEvaluationForm;
exports.submitEvaluationResponse = submitEvaluationResponse;
exports.getUniversityByAdmin = getUniversityByAdmin;
exports.generateStudentScheduleData = generateStudentScheduleData;
exports.getFacultyListForStudent = getFacultyListForStudent;
exports.getAcademicBackground = getAcademicBackground;
exports.exportStudentEvaluation = exportStudentEvaluation;
// You can add more functions as you develop them
// Example:
// exports.anotherFunction = require('./path/to/file').functionName;

console.log('Firebase Functions initialized');