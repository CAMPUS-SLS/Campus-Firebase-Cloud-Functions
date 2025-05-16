const { Client } = require('pg');

async function getStudentEvaluationData() {
  const db = new Client({
    connectionString:
      'postgresql://neondb_owner:npg_mQOGqHwl95Cd@ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
  });

  await db.connect();

  const result = await db.query(`
    SELECT 
      student_eval_id,
      student_id,
      professor_id,
      course_id,
      technical_mastery,
      ability_to_give_example,
      communicates_well,
      average_score
    FROM "Student_Evaluation"
  `);

  await db.end();
  return result.rows;
}

module.exports = {
  getStudentEvaluationData,
};
