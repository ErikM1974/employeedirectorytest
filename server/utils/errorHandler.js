/**
 * Safely extracts relevant information from error objects,
 * handling circular references and complex objects
 */
const extractErrorInfo = (error) => {
    const errorInfo = {
        message: error.message,
        status: error.response?.status,
        details: null,
        code: error.code,
        path: error.config?.url,
        method: error.config?.method?.toUpperCase()
    };

    // Try to extract response data safely
    if (error.response?.data) {
        try {
            if (typeof error.response.data === 'string') {
                errorInfo.details = error.response.data;
            } else if (Buffer.isBuffer(error.response.data)) {
                errorInfo.details = error.response.data.toString('utf8');
            } else if (typeof error.response.data === 'object') {
                // Extract only the useful parts of the response data
                const { Code, Message, ...rest } = error.response.data;
                errorInfo.details = {
                    code: Code,
                    message: Message,
                    ...rest
                };
            }
        } catch (e) {
            errorInfo.details = 'Error details could not be processed';
        }
    }

    // Add headers that might be useful for debugging
    if (error.response?.headers) {
        errorInfo.headers = {
            'content-type': error.response.headers['content-type'],
            'x-caspio-request-id': error.response.headers['x-caspio-request-id']
        };
    }

    return errorInfo;
};

/**
 * Logs error details in a structured way
 */
const logError = (context, error) => {
    console.error(`[${context}] Error:`, {
        message: error.message,
        status: error.response?.status,
        path: error.config?.url,
        method: error.config?.method,
        requestId: error.response?.headers?.['x-caspio-request-id']
    });

    if (error.response?.data) {
        console.error(`[${context}] Response data:`, 
            typeof error.response.data === 'string' 
                ? error.response.data 
                : JSON.stringify(error.response.data, null, 2)
        );
    }
};

/**
 * Creates a standardized error response
 */
const createErrorResponse = (error, context = 'API') => {
    logError(context, error);
    
    const errorInfo = extractErrorInfo(error);
    
    // Use appropriate status code
    const statusCode = error.response?.status || 
        (error.code === 'ECONNREFUSED' ? 503 : 500);

    // Return standardized error response
    return {
        status: statusCode,
        body: {
            error: true,
            message: errorInfo.message,
            details: errorInfo.details,
            code: errorInfo.code,
            requestId: errorInfo.headers?.['x-caspio-request-id']
        }
    };
};

module.exports = {
    extractErrorInfo,
    logError,
    createErrorResponse
};
