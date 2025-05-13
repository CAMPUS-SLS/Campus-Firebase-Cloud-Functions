const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pool = require('../../../../config/db-config');

/**
 * Get campus results with optional filtering
 * @param {Object} data - The request data containing filter criteria
 * @param {Object} context - The function context
 * @returns {Promise<Object>} - Filtered campus results data
 */
const getCampusResults = async (data, context) => {
    try {
        // Verify admin authentication
        if (!context.auth || !context.auth.token.admin) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only administrators can access this function'
            );
        }

        const { filterCriteria } = data;
        let query = `
            SELECT 
                id,
                last_name as "lastName",
                first_name as "firstName",
                mi,
                priority_program as "priorityProgram",
                priority_program_status as "priorityProgramStatus",
                alternative_program as "alternativeProgram",
                alternative_program_status as "alternativeProgramStatus",
                mobile,
                telephone,
                email
            FROM campus_results
            WHERE 1=1
        `;
        const queryParams = [];

        // Apply filters
        if (filterCriteria) {
            if (filterCriteria.searchQuery) {
                query += `
                    AND (
                        LOWER(id) LIKE LOWER($${queryParams.length + 1}) OR
                        LOWER(last_name) LIKE LOWER($${queryParams.length + 1}) OR
                        LOWER(first_name) LIKE LOWER($${queryParams.length + 1}) OR
                        LOWER(priority_program) LIKE LOWER($${queryParams.length + 1}) OR
                        LOWER(alternative_program) LIKE LOWER($${queryParams.length + 1})
                    )
                `;
                queryParams.push(`%${filterCriteria.searchQuery}%`);
            }

            if (filterCriteria.status) {
                query += `
                    AND (
                        priority_program_status = $${queryParams.length + 1} OR
                        alternative_program_status = $${queryParams.length + 1}
                    )
                `;
                queryParams.push(filterCriteria.status);
            }
        }

        // Add sorting
        query += ` ORDER BY id ASC`;

        // Execute query
        const result = await pool.query(query, queryParams);
        
        return {
            success: true,
            data: result.rows,
            metadata: {
                totalFiltered: result.rows.length,
                filtersApplied: Object.keys(filterCriteria || {}),
                message: "Campus results retrieved successfully"
            }
        };
    } catch (error) {
        console.error('Error in getCampusResults:', error);
        throw new functions.https.HttpsError(
            'internal',
            'An error occurred while retrieving campus results',
            {
                originalError: error.message,
                stack: error.stack
            }
        );
    }
};

module.exports = {
    getCampusResults
}; 