const { onCall } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const { pool } = require("../../../../config/db-config"); // Adjusted path

/**
 * Get applicants filtered by college and status.
 * @param {Object} data - The request data from the client.
 * @param {string} [data.college] - Optional: The college name to filter by.
 * @param {string} [data.status] - Optional: The enrollment status to filter by.
 * @returns {Promise<Object>} - An object containing the list of applicants.
 */
const getApplicantsByCollegeStatus = onCall(
  {
    cors: true, // Enable CORS if called from a web client
    maxInstances: 10, // Recommended for managing concurrent executions
  },
  async (request) => {
    try {
      // Verify admin authentication using ID token from client
      // Assumes frontend sends Firebase ID token in Authorization header: "Bearer <token>"
      const authHeader = request.rawRequest.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized - No token provided");
      }
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await getAuth().verifyIdToken(idToken);
      if (!decodedToken.admin) {
        throw new Error("Unauthorized - Admin access required");
      }

      const { college, status } = request.data || {}; // Filters from client

      // Base query - same as in Reservation_View-ADMIN.js
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
      let paramIndex = 1;

      if (college) {
        query += ` AND c.college_name = $${paramIndex++}`;
        params.push(college);
      }

      if (status) {
        query += ` AND e.enrollment_status = $${paramIndex++}`;
        params.push(status);
      }

      query += ` ORDER BY up.last_name ASC, up.first_name ASC`;

      const result = await pool.query(query, params);

      return {
        success: true, // Indicate success
        applicants: result.rows,
        metadata: { // Optional metadata
          total: result.rows.length,
          filtersApplied: { college, status }
        }
      };

    } catch (error) {
      console.error("Error in getApplicantsByCollegeStatus:", error);
      // Throwing an error that the client can catch and display
      // Consider if you want to expose error.message directly or use a generic one
      throw new Error(`Failed to get applicants: ${error.message}`);
    }
  }
);

/**
 * Get documents for a specific student, with optional filtering by documentType and documentStatus.
 * @param {Object} data - The request data from the client.
 * @param {string} data.applicantId - The ID of the student whose documents to fetch.
 * @param {Object} [data.filterCriteria] - Optional filter criteria for documents.
 * @param {string} [data.filterCriteria.documentType] - Filter by document type.
 * @param {string} [data.filterCriteria.status] - Filter by document status.
 * @returns {Promise<Object>} - An object containing the list of documents.
 */
const getStudentDocuments = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      // Verify admin authentication
      const authHeader = request.rawRequest.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized - No token provided");
      }
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await getAuth().verifyIdToken(idToken);
      if (!decodedToken.admin) {
        throw new Error("Unauthorized - Admin access required");
      }

      const { applicantId, filterCriteria = {} } = request.data;

      if (!applicantId) {
        // It's good practice to return a more specific error or status code
        // For HttpsError, you might use 'invalid-argument'
        // For now, throwing a standard Error
        throw new Error("Applicant ID is required to fetch documents.");
      }

      // --- !!! IMPORTANT: REPLACE PLACEHOLDERS BELOW WITH YOUR ACTUAL NeonDB SCHEMA !!! ---
      // --- Table Name for Documents (e.g., "StudentDocuments", "ApplicantFiles") ---
      const documentTableName = "\"YourDocumentTableName\""; // Use double quotes for case sensitivity if needed

      // --- Column Names in Your Document Table ---
      const pkColumn = "doc_id";                 // Primary Key of the document table (e.g., 'doc_id', 'document_uuid')
      const fkStudentColumn = "student_id";      // Foreign Key linking to Student table (e.g., 'student_id', 'applicant_id')
      const docNameColumn = "document_name";     // Column for document's name/title (e.g., 'doc_title', 'file_name')
      const docTypeColumn = "document_type";     // Column for type of document (e.g., 'doc_type', 'category')
      const docStatusColumn = "document_status"; // Column for status OF THE DOCUMENT (e.g., 'doc_status', 'review_status')
      const submissionDateColumn = "submission_date"; // Column for submission date (e.g., 'created_at', 'uploaded_on')
      // Add any other columns you need to select for the frontend:
      // const fileUrlColumn = "file_url"; 

      let query = `
        SELECT 
          ${pool.escapeId(pkColumn)} as id,
          ${pool.escapeId(docNameColumn)} as name,
          ${pool.escapeId(docTypeColumn)} as "documentType", 
          ${pool.escapeId(docStatusColumn)} as status,
          ${pool.escapeId(submissionDateColumn)} as "dateSubmitted"
          // , ${pool.escapeId(fileUrlColumn)} as "fileUrl" // Uncomment and add if you have a file URL column
          // Add other columns you need from your document table
        FROM ${documentTableName}
        WHERE ${pool.escapeId(fkStudentColumn)} = $1
      `;
      
      const params = [applicantId];
      let paramIndex = 2; // Starts at 2 because applicantId is $1 for the WHERE clause

      if (filterCriteria.documentType) {
        query += ` AND ${pool.escapeId(docTypeColumn)} = $${paramIndex++}`;
        params.push(filterCriteria.documentType);
      }

      if (filterCriteria.status) { // This 'status' is from filterCriteria for document status
        query += ` AND ${pool.escapeId(docStatusColumn)} = $${paramIndex++}`;
        params.push(filterCriteria.status);
      }

      // Add other filters as needed, e.g., for date ranges, author, department, tags
      // if (filterCriteria.author) { query += ` AND your_author_column = $${paramIndex++}`; params.push(filterCriteria.author); }

      query += ` ORDER BY ${pool.escapeId(submissionDateColumn)} DESC`; // Example ordering

      // --- End of Placeholder Section ---

      console.log(`Executing query for getStudentDocuments: ${query} with params: ${JSON.stringify(params)}`);
      const result = await pool.query(query, params);

      return {
        success: true,
        data: result.rows, // This will be the array of document objects
        metadata: {
          total: result.rows.length,
          filtersApplied: filterCriteria,
          forApplicantId: applicantId
        }
      };

    } catch (error) {
      console.error("Error in getStudentDocuments:", error);
      // Consider logging the applicantId and filters for better debugging context
      console.error(`Context - Applicant ID: ${request.data?.applicantId}, Filters: ${JSON.stringify(request.data?.filterCriteria)}`);
      throw new Error(`Failed to get student documents: ${error.message}`);
    }
  }
);

module.exports = {
  getApplicantsByCollegeStatus,
  getStudentDocuments, // Exporting the new function
};