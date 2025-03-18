
const nodemailer = require('nodemailer');
const PropertiesReader = require('properties-reader');
const path = require('path');

const properties = PropertiesReader(path.resolve(
    "..",
    "config",
    "config.properties"
  ));

const transporter = nodemailer.createTransport({
  service: properties.get('egl.gmail.service'), // You can use other services like 'smtp', 'yahoo', etc.
  auth: {
    user: properties.get('egl.gmail.user'), // Your email address
    pass: properties.get('egl.gmail.password'),  // Your email password or App-specific password
  },
});

// const smtpConfig = {
//   host: properties.get('egl.mail.server.host'),
//   port: properties.get('egl.mail.smtp.port'), // SMTP Port
//   secure: properties.get('egl.mail.smtp.auth'), // If your SMTP server doesn't require SSL
//   auth: {
//     user: properties.get('egl.mail.sending.email.id'), // Sender email address
//     pass: properties.get('egl.mail.sending.email.pass'), // Password for the email account (fill in accordingly)
//   },
//   tls: {
//     rejectUnauthorized: false, // This may be necessary if the server's certificate is self-signed
//   },
// };

// Create reusable transporter object using SMTP transport
//const transporter = nodemailer.createTransport(smtpConfig);


module.exports =  {transporter};