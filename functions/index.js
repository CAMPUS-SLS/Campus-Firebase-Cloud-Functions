
const { generateStudentScheduleData } = require("./src/triggers/http/generateStudentScheduleData")
const { gradesRetriever } = require("./src/triggers/http/gradesRetriever")


exports.generateStudentScheduleData = generateStudentScheduleData;
exports.gradesRetriever = gradesRetriever;

console.log('Firebase Functions initialized');