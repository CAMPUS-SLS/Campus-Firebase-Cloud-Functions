const { getAllProfileData } = require("./src/triggers/http/getAllProfileData")
exports.getAllProfileData = getAllProfileData

const { generateStudentScheduleData } = require("./src/triggers/http/generateStudentScheduleData")
// const { gradesRetriever } = require("./src/triggers/http/gradesRetriever")
const { getStudentEvents } = require("./src/triggers/http/events")
const { updateStudentEvents } = require("./src/triggers/http/events")
const { createStudentEvents } = require("./src/triggers/http/events")



exports.generateStudentScheduleData = generateStudentScheduleData;
// exports.gradesRetriever = gradesRetriever;
exports.getStudentEvents = getStudentEvents;
exports.updateStudentEvents = updateStudentEvents;
exports.createStudentEvents = createStudentEvents;

console.log('Firebase Functions initialized');