const { getErrorRecipients } = require("./emailRecipients"); // Adjust path as needed
const fs = require("fs");
const path = require("path");
const { logger } = require("./logger"); // Adjust path
const  { transporter } =require("./emailSend")
const { FROM_EMAIL } =require("./fromEmail")


// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: "your-email@example.com",
//         pass: "your-email-password"
//     }
// });

async function sendErrorMail(errorDetails) {
    try {
        const recipients = await getErrorRecipients(); // Await result

        if (!recipients) {
            logger.warn("No recipients found for error notifications.");
            return;
        }
        const emails =  recipients
        const emailList = emails.split(',');
        
        // Read Email Template
        const templatePath = path.join(__dirname, "..","..", "emailTemp", "serverError.html");
        const emailTemplate = fs.readFileSync(templatePath, "utf8"); // Use synchronous read
        
        const formattedEmail = emailTemplate.replace("{{errorDetails}}", errorDetails.replace(/\n/g, "<br>"));

        const mailOptions = {
            from: FROM_EMAIL,
            to: emailList,
            subject: "🚨 Critical Server Error Notification 🚨",
            html: formattedEmail
        };

        const info = await transporter.sendMail(mailOptions); // Await sending mail
        logger.info("Error email sent successfully: " + info.response);
    } catch (error) {
        logger.error("Failed to send error email: " + error.message);
    }
}

module.exports = { sendErrorMail };
