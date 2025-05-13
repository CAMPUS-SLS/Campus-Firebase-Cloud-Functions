const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Load all document data for the authenticated user
 * @param {Object} data - The request data
 * @param {Object} context - The function context
 * @returns {Promise<Object>} - Document data
 */
const loadDocumentData = async (data, context) => {
    try {
        // Verify admin authentication
        if (!context.auth || !context.auth.token.admin) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only administrators can access this function'
            );
        }

        // Get documents from Firestore
        const db = admin.firestore();
        const documentsSnapshot = await db.collection('documents').get();
        
        const documents = [];
        documentsSnapshot.forEach(doc => {
            documents.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            data: documents
        };
    } catch (error) {
        console.error('Error in loadDocumentData:', error);
        throw new functions.https.HttpsError(
            'internal',
            'An error occurred while loading documents',
            {
                originalError: error.message,
                stack: error.stack
            }
        );
    }
};

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

        const { filterCriteria } = data;
        const db = admin.firestore();
        let query = db.collection('documents');

        // Apply filters
        if (filterCriteria.documentType) {
            query = query.where('documentType', '==', filterCriteria.documentType);
        }
        if (filterCriteria.status) {
            query = query.where('status', '==', filterCriteria.status);
        }
        if (filterCriteria.author) {
            query = query.where('author', '==', filterCriteria.author);
        }
        if (filterCriteria.department) {
            query = query.where('department', '==', filterCriteria.department);
        }

        const documentsSnapshot = await query.get();
        const documents = [];
        documentsSnapshot.forEach(doc => {
            documents.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            data: documents,
            metadata: {
                totalFiltered: documents.length,
                filtersApplied: Object.keys(filterCriteria || {}),
                message: "Documents filtered successfully"
            }
        };
    } catch (error) {
        console.error('Error in filterDocumentData:', error);
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
    loadDocumentData,
    filterDocumentData
};