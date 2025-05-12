const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pool = require('../../../../config/db-config');

/**
 * Filter document data based on provided criteria
 * @param {Object} data - The request data containing filter criteria
 * @param {Object} context - The function context
 * @returns {Promise<Object>} - Filtered document data
 */
const filterDocumentData = async (data, context) => {
    try {
        // Verify admin authentication
        if (!context.auth || !context.auth.token.admin) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only administrators can access this function'
            );
        }

        const { filterCriteria = {} } = data;
        const {
            documentType,
            status,
            dateCreated,
            dateModified,
            author,
            department,
            tags
        } = filterCriteria;

        // Build the SQL query
        let query = 'SELECT * FROM documents WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (documentType) {
            query += ` AND document_type = $${paramCount}`;
            params.push(documentType);
            paramCount++;
        }

        if (status) {
            query += ` AND status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (author) {
            query += ` AND author = $${paramCount}`;
            params.push(author);
            paramCount++;
        }

        if (department) {
            query += ` AND department = $${paramCount}`;
            params.push(department);
            paramCount++;
        }

        if (dateCreated) {
            query += ` AND date_created >= $${paramCount}`;
            params.push(dateCreated);
            paramCount++;
        }

        if (dateModified) {
            query += ` AND date_modified >= $${paramCount}`;
            params.push(dateModified);
            paramCount++;
        }

        if (tags && tags.length > 0) {
            query += ` AND tags && $${paramCount}`;
            params.push(tags);
            paramCount++;
        }

        // Execute the query
        const result = await pool.query(query, params);
        const documents = result.rows;

        return {
            success: true,
            data: documents,
            metadata: {
                totalFiltered: documents.length,
                filtersApplied: Object.keys(filterCriteria).filter(key => filterCriteria[key])
            }
        };

    } catch (error) {
        console.error('Error in filterDocumentData:', error);
        throw new functions.https.HttpsError(
            'internal',
            'An error occurred while filtering documents',
            error.message
        );
    }
};

module.exports = {
    filterDocumentData
};