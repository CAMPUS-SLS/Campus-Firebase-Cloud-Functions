const { getStudentEvaluationData } = require('../services/studentEvaluationService');

exports.handler = async (event) => {
  try {
    const data = await getStudentEvaluationData();

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Student evaluation data fetched successfully.',
        data,
      }),
    };
  } catch (err) {
    console.error('❌ Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        message: 'Server error',
      }),
    };
  }
};
