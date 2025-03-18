//const { json } = require('express');
const express = require('express')
const emailTempateRouter =express.Router();
//const District = require('../models/districts')
const { transporter } = require('../utils/emailSend')
//const { eglEmailTemplate } = require('../emailTemplates/eglEmailTemplate')
const path = require('path');
const fs = require('fs');
const {FROM_EMAIL} = require('../utils/emailSend')

emailTempateRouter.post('/send', (req, res) => {
  
  const data1 ={
        "COM_GL_AC_CODE_SEG6": "134567",
        "COM_GL_AC_DESC": "test",
        "EGL_AC_CODE_SEG3": "001",
        "EGL_PROD_CODE_SEG4": "567",
        "EGL_INT_COM_CODE_SEG5": "TES",
        "EGL_FUTURE3_SEG6": "00000",
        "EGL_SUB_AC_SEG7": "test",
        "EGL_FUTURE5_SEG8": "0000",
        "STAGE": "UPDATED",
        "EGL_CODE_ID": 118,
        "EGL_REV_DU": "N",
        "ACTION_COMMENTS": null,
        "CREATION_DATE": "2024-12-17",
    }
    const userDtl = {USER_NAME : "NARESH VISWANADHAPALLI"}
    const sub = "Request for APPROVAL EGL ACC CODE MAP"
    const toMails = ["naresh@unisonconsulting.com.sg", "nvnaresh55@gmail.com", "sirisha194@gmail.com"]

    //const templatePath = path.join(__dirname, '..', 'emailTemplates', 'eglEmailTemplates.html');
    const templatePath =  path.resolve('D:', 'emailTemplates', 'eglEmailTemplates.html');
    fs.readFile(templatePath, 'utf-8', (err, data) => {
      if (err) {
        console.log(err, "fileErr")
        return res.status(500).send('Error reading the template file');
      }
  
      // Replace placeholders with dynamic data
      let emailContent = data;
      emailContent = emailContent.replace(/{{COM_GL_AC_CODE_SEG6}}/g, data1.COM_GL_AC_CODE_SEG6);
      emailContent = emailContent.replace(/{{COM_GL_AC_DESC}}/g, data1.COM_GL_AC_DESC);
      emailContent = emailContent.replace(/{{EGL_AC_CODE_SEG3}}/g, data1.EGL_AC_CODE_SEG3);
      emailContent = emailContent.replace(/{{EGL_PROD_CODE_SEG4}}/g, data1.EGL_PROD_CODE_SEG4);
      emailContent = emailContent.replace(/{{EGL_INT_COM_CODE_SEG5}}/g, data1.EGL_INT_COM_CODE_SEG5);
      emailContent = emailContent.replace(/{{EGL_FUTURE3_SEG6}}/g, data1.EGL_FUTURE3_SEG6);
      emailContent = emailContent.replace(/{{EGL_SUB_AC_SEG7}}/g, data1.EGL_SUB_AC_SEG7);
      emailContent = emailContent.replace(/{{EGL_FUTURE5_SEG8}}/g, data1.EGL_FUTURE5_SEG8);
      emailContent = emailContent.replace(/{{EGL_REV_DU}}/g, data1.EGL_REV_DU);
      emailContent = emailContent.replace(/{{STAGE}}/g, data1.STAGE);
      emailContent = emailContent.replace(/{{CREATION_DATE}}/g, data1.CREATION_DATE);
      emailContent = emailContent.replace(/{{USER_NAME}}/g, userDtl.USER_NAME);
  
      // Send the email
      const mailOptions = {
        from: FROM_EMAIL,
        to: toMails,
        subject: sub,
        html: emailContent // Use the updated HTML content
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send('Error sending email: ' + error);
        }
        res.send('Email sent successfully: ' + info.response);
      });
    });
    
    
//   const emailOption = eglEmailTemplate(data,userDtl,toMails,sub)

// //   const { to, subject } = req.body;  // Destructure data from request body
// // //  const subject = "EXAMPLE SUB";
// // //  const text = "Test"
// //    const htmlTemplate = `
// // <!DOCTYPE html>
// // <html>
// // <head>
// //     <meta name="viewport" content="width=device-width, initial-scale=1">
// // <style>
// // #email-text{
// // }
// // #initial-hi{
// // margin-left:10px;
// // }
// // .body-center{
// // margin-left:100px;
// // }
// // .left-txt-thanks{
// // margin-left:10px;
// // }
// // .left-txt-name{
// // margin-left:10px;
// // }
// // table, th, td {
// //   border: 1px solid black;
// //   border-collapse: collapse;
// // }
// // table {
// //   border-collapse: collapse;
// //   border-spacing: 0;
// //   width: 100%;
// //   border: 1px solid #ddd;
// // }

// // th, td {
// //   text-align: left;
// //   padding: 8px;
// // }

// // tr:nth-child(even){background-color: #f2f2f2}

// // </style>
// // </head>
// // <body id="email-text">
// // <p id="initial-hi">Hi</p>
// // <p class="body-center">I have Created new record for <b>EGL ACCOUNT CODE MAP</b>, Please approve</p>
// // <p><b>USER DETAILS</b></p>
// // <div>
// //     <table style="overflow-x:auto;">
// //         <tr>
// //           <th>COM_GL_AC_CODE_SEG6</th>
// //           <th>COM_GL_AC_DESC</th> 
// //           <th>EGL_AC_CODE_SEG3</th>
// //           <th>EGL_PROD_CODE_SEG4</th>
// //           <th>EGL_INT_COM_CODE_SEG5</th>
// //           <th>EGL_FUTURE3_SEG6</th>
// //           <th>EGL_SUB_AC_SEG7</th>
// //           <th>EGL_FUTURE5_SEG8</th>
// //           <th>EGL_REV_DU</th>
// //           <th>STAGE</th>
// //           <th>CREATION_DATE</th>
// //         </tr>
// //         <tr>
// //           <td>${req.body.COM_GL_AC_CODE_SEG6}</td>
// //           <td>${req.body.COM_GL_AC_DESC}</td>
// //           <td>${req.body.EGL_AC_CODE_SEG3}</td>
// //           <td>${req.body.EGL_PROD_CODE_SEG4}</td>
// //           <td>${req.body.EGL_INT_COM_CODE_SEG5}</td>
// //           <td>${req.body.EGL_FUTURE3_SEG6}</td>
// //           <td>${req.body.EGL_SUB_AC_SEG7}</td>
// //           <td>${req.body.EGL_FUTURE5_SEG8}</td>
// //           <td>${req.body.EGL_REV_DU}</td>
// //           <td>${req.body.CREATION_DATE}</td>
// //         </tr>
    
// //       </table>
// // </div>
// // <p class="left-txt-thanks">Thanks & Regards</p>
// // <p class="left-txt-name"></p>
// // </body>
// // </html>
// // `;

// // const mailOptions = {
// //   from: 'vnaresh.lucky6@gmail.com',
// //   to: to,
// //   subject: subject,
// //   html: htmlTemplate,
// // };


// //   // Define email options
// //   const mailOptions = {
// //     from: 'your-email@gmail.com',
// //     to: to,  // Recipient email
// //     subject: subject,  // Subject of the email
// //     text: text,  // Plain text version
// //     html: html,  // HTML version
// //   };

//   // Send email using the defined transporter and mailOptions
//   transporter.sendMail(emailOption, (error, info) => {
//     if (error) {
//       console.log(error);
//       return res.status(500).send('Error sending email');
//     }
//     console.log('Email sent: ' + info.response);
//     return res.status(200).send('Email sent successfully');
//   });
});

module.exports = emailTempateRouter
