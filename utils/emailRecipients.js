const { getPool } = require("../Database/db"); // Adjust path as needed
const { logger }= require("./logger"); // Adjust path as needed

async function getErrorRecipients() {
    try {
        const pool = await getPool(); // Await the promise
        const result = await pool
            .request()
            .query("SELECT DISTRIBUTION_LIST FROM T_EGL_EMAIL_TRIGGER_LIST WHERE REPORT_NAME = 'ERROR_NOTIFICATION'");
        
        return result.recordset.length > 0 ? result.recordset[0].DISTRIBUTION_LIST : null;
    } catch (error) {
        logger.error("Failed to fetch error mail recipients: " + error.message);
        throw error; // Propagate the error
    }
}

module.exports = { getErrorRecipients };
