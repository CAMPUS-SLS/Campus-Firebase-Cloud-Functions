const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Get all applicants with optional filtering
 * @param {Object} data - The request data containing filter criteria
 * @param {Object} context - The function context
 * @returns {Promise<Object>} - Filtered applicant data
 */
const getApplicants = async (data, context) => {
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
        let query = db.collection('applicants');

        // Apply filters
        if (filterCriteria) {
            if (filterCriteria.college) {
                query = query.where('college', '==', filterCriteria.college);
            }
            if (filterCriteria.status) {
                query = query.where('status', '==', filterCriteria.status);
            }
            if (filterCriteria.program) {
                query = query.where('program', '==', filterCriteria.program);
            }
            if (filterCriteria.searchQuery) {
                // For search, we'll need to handle it in memory since Firestore doesn't support
                // full-text search directly
                const searchQuery = filterCriteria.searchQuery.toLowerCase();
                const snapshot = await query.get();
                const applicants = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (
                        data.id.toLowerCase().includes(searchQuery) ||
                        data.lastName.toLowerCase().includes(searchQuery) ||
                        data.firstName.toLowerCase().includes(searchQuery) ||
                        data.college.toLowerCase().includes(searchQuery) ||
                        data.program.toLowerCase().includes(searchQuery) ||
                        data.status.toLowerCase().includes(searchQuery)
                    ) {
                        applicants.push({
                            id: doc.id,
                            ...data
                        });
                    }
                });
                return {
                    success: true,
                    data: applicants,
                    metadata: {
                        totalFiltered: applicants.length,
                        filtersApplied: Object.keys(filterCriteria || {}),
                        message: "Applicants filtered successfully"
                    }
                };
            }
        }

        // If no search query, get all documents
        const documentsSnapshot = await query.get();
        const applicants = [];
        documentsSnapshot.forEach(doc => {
            applicants.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            data: applicants,
            metadata: {
                totalFiltered: applicants.length,
                filtersApplied: Object.keys(filterCriteria || {}),
                message: "Applicants retrieved successfully"
            }
        };
    } catch (error) {
        console.error('Error in getApplicants:', error);
        throw new functions.https.HttpsError(
            'internal',
            'An error occurred while retrieving applicants',
            {
                originalError: error.message,
                stack: error.stack
            }
        );
    }
};

module.exports = {
    getApplicants
}; 