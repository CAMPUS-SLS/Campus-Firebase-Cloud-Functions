const { onCall } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const { pool } = require("../../../../config/db-config");

/**
 * Get admission applicants with optional filtering
 * @param {Object} data - The request data
 * @param {Object} data.filterCriteria - Filter criteria for applicants
 * @param {string} data.filterCriteria.searchQuery - Search query to filter applicants
 * @param {string} data.filterCriteria.college - College filter
 * @param {string} data.filterCriteria.program - Program filter
 * @param {string} data.filterCriteria.status - Status filter
 * @returns {Promise<Object>} - The filtered applicants data
 */
const getAdmissionApplicants = onCall(async (request) => {
  try {
    // Verify admin authentication
    const auth = getAuth();
    const idToken = request.auth?.token;
    if (!idToken || !idToken.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { filterCriteria = {} } = request.data;
    const { searchQuery = "", college = "", program = "", status = "" } = filterCriteria;

    // Build the base query
    let query = `
     SELECT 
        s.student_id as id,
        up.last_name as "lastName",
        up.first_name as "firstName",
        up.middle_name as mi,
        c.college_name as college,
        d.department_name as program,
        e.enrollment_status as status
      FROM "Student" s
      JOIN "User" u ON s.user_id = u.user_id
      JOIN "User_Profile" up ON u.user_id = up.user_id
      JOIN "Enrollment" e ON s.student_id = e.student_id
      JOIN "Department" d ON e.department_id = d.department_id
      JOIN "College" c ON d.college_id = c.college_id
      WHERE 1=1
    `;
    const params = [];

    // Add search condition if searchQuery is provided
    if (searchQuery) {
      query += `
        AND (
          LOWER(s.student_id) LIKE LOWER($${params.length + 1}) OR
          LOWER(up.last_name) LIKE LOWER($${params.length + 1}) OR
          LOWER(up.first_name) LIKE LOWER($${params.length + 1}) OR
          LOWER(c.college_name) LIKE LOWER($${params.length + 1}) OR
          LOWER(d.department_name) LIKE LOWER($${params.length + 1}) OR
          LOWER(e.enrollment_status) LIKE LOWER($${params.length + 1})
        )
      `;
      params.push(`%${searchQuery}%`);
    }

    // Add college filter if provided
    if (college) {
      query += ` AND c.college_name = $${params.length + 1}`;
      params.push(college);
    }

    // Add program filter if provided
    if (program) {
      query += ` AND d.department_name = $${params.length + 1}`;
      params.push(program);
    }

    // Add status filter if provided
    if (status) {
      query += ` AND e.enrollment_status = $${params.length + 1}`;
      params.push(status);
    }

    // Add sorting
    query += ` ORDER BY up.last_name ASC, up.first_name ASC`;

    // Execute the query
    const result = await pool.query(query, params);

    return {
      data: result.rows,
      metadata: {
        total: result.rows.length,
        filters: {
          searchQuery,
          college,
          program,
          status
        }
      }
    };
  } catch (error) {
    console.error("Error in getAdmissionApplicants:", error);
    throw new Error(error.message);
  }
});

/**
 * Get unique colleges for admission filter dropdown
 * @returns {Promise<Object>} - List of unique colleges
 */
const getAdmissionColleges = onCall(async (request) => {
  try {
    // Verify admin authentication
    const auth = getAuth();
    const idToken = request.auth?.token;
    if (!idToken || !idToken.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const query = `
      SELECT DISTINCT c.college_name as college
      FROM "College" c
      JOIN "Department" d ON c.college_id = d.college_id
      JOIN "Enrollment" e ON d.department_id = e.department_id
      WHERE c.college_name IS NOT NULL 
      ORDER BY c.college_name ASC
    `;
    const result = await pool.query(query);

    return {
      data: result.rows.map(row => row.college)
    };
  } catch (error) {
    console.error("Error in getAdmissionColleges:", error);
    throw new Error(error.message);
  }
});

/**
 * Get unique programs (departments) for admission filter dropdown
 * @returns {Promise<Object>} - List of unique programs
 */
const getAdmissionPrograms = onCall(async (request) => {
  try {
    // Verify admin authentication
    const auth = getAuth();
    const idToken = request.auth?.token;
    if (!idToken || !idToken.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const query = `
      SELECT DISTINCT d.department_name as program
      FROM "Department" d
      JOIN "Enrollment" e ON d.department_id = e.department_id
      WHERE d.department_name IS NOT NULL 
      ORDER BY d.department_name ASC
    `;
    const result = await pool.query(query);

    return {
      data: result.rows.map(row => row.program)
    };
  } catch (error) {
    console.error("Error in getAdmissionPrograms:", error);
    throw new Error(error.message);
  }
});

module.exports = {
  getAdmissionApplicants,
  getAdmissionColleges,
  getAdmissionPrograms
};
