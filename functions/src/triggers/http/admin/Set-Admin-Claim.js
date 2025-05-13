const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Sets admin claim for a user
 * @param {Object} data - The request data containing the user's UID
 * @param {Object} context - The function context
 * @returns {Promise<Object>} - Result of the operation
 */
const setAdminClaimFunction = async (data, context) => {
    try {
        // Verify admin authentication
        if (!context.auth || !context.auth.token.admin) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only administrators can set admin claims'
            );
        }

        const { uid } = data;
        if (!uid) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'User UID is required'
            );
        }

        // Set admin claim
        await admin.auth().setCustomUserClaims(uid, { admin: true });

        return {
            success: true,
            message: 'Admin claim set successfully'
        };
    } catch (error) {
        console.error('Error in setAdminClaim:', error);
        throw new functions.https.HttpsError(
            'internal',
            'An error occurred while setting admin claim',
            {
                originalError: error.message,
                stack: error.stack
            }
        );
    }
};

module.exports = {
    setAdminClaimFunction
}; 