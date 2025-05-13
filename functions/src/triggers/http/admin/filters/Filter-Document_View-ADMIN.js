const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Filter document data based on provided criteria
 * @param {Object} data - The request data containing filter criteria
 * @param {Object} context - The function context
 * @returns {Promise<Object>} - Filtered document data
 */
const filterDocumentData = async (data, context) => {
    try {
        console.log('Function called with data:', data);
        console.log('Context:', context);

        // Verify admin authentication
        if (!context.auth || !context.auth.token.admin) {
            console.log('Authentication failed:', context.auth);
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only administrators can access this function'
            );
        }

        // For testing connection - return a simple response
        const response = {
            success: true,
            data: [
                {
                    id: "TEST001",
                    documentType: "Test Document",
                    status: "Test Status",
                    dateCreated: new Date().toISOString(),
                    author: "Test Author",
                    department: "Test Department"
                }
            ],
            metadata: {
                totalFiltered: 1,
                filtersApplied: Object.keys(data.filterCriteria || {}),
                message: "Connection test successful"
            }
        };

        console.log('Sending response:', response);
        return response;

    } catch (error) {
        console.error('Detailed error in filterDocumentData:', {
            error: error,
            message: error.message,
            stack: error.stack
        });
        
        throw new functions.https.HttpsError(
            'internal',
            'An error occurred while filtering documents',
            {
                originalError: error.message,
                stack: error.stack
            }
        );
    }
};

module.exports = {
    filterDocumentData
};