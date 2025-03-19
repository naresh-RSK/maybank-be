const express = require("express");
const loginRouter = express.Router();
const { getPool } = require("../Database/db");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const PropertiesReader = require("properties-reader");
//const { insertQuery, convertDatesInObject } = require('../utils/insertQuery')
//const { usersAudit } = require('../utils/UsersData')
const { OTP_SUB, FROM_EMAIL, SYSTEM_ERROR } = require("../utils/fromEmail");
const { transporter } = require("../utils/emailSend");
const ldap = require("ldapjs");

const properties = PropertiesReader(
  path.resolve("..", "config", "config.properties")
);
let decodedBuffer = Buffer.from(
  properties.get("ldap.security.credential"),
  "base64"
);
let decodedPassword = decodedBuffer?.toString("utf-8");
console.log("System Admin password check:", decodedPassword);
//const ldapUrl = 'ldap://10.4.71.50:636'; // Replace with your LDAP server URL
const ldapUrl = properties.get("ldap.provider.url"); // Replace with your LDAP server URL
const baseDN = properties.get("ldap.search.base"); // Replace with your base DN
//const adminDN = 'DC=mbb,DC=com,DC=sg'; // Replace with your admin DN
const adminDN = properties.get("ldap.security.principal"); // Replace with your admin DN
//const adminDN = 'cn=biappusr,dc=mbb,dc=com,dc=sg'; // Replace with your admin DN
const adminPassword = decodedPassword; // Replace with your admin password

const authenticateUser = (username, password, responseauth) => {
  return new Promise((resolve, reject) => {
    const ldapclient = ldap.createClient({
      url: ldapUrl,
    });

    // Bind as admin to search for the user
    ldapclient.bind(adminDN, adminPassword, (err) => {
      if (err) {
        return reject("Error binding to LDAP server");
      } else {
        console.log("LDAP Server Connects Well.");
      }

      const searchOptions = {
        filter: `(&(objectClass=user)(sAMAccountName=${username}))`, // Filter by objectClass and sAMAccountName
        scope: "sub", // Search the entire subtree
        attributes: ["dn", "cn", "mail", "sAMAccountName"], // Attributes to retrieve
      };

      ldapclient.search(baseDN, searchOptions, (searchErr, res) => {
        if (searchErr) {
          return reject("Error during LDAP search");
        }

        let userFound = false;
        let userDN = null;

        res.on("searchEntry", (entry) => {
          userFound = true;
          userDN = entry.dn.toString();
          console.log(username, "USER IN LDAP", userDN);
        });

        res.on("end", (result) => {
          if (userFound) {
            ldapclient.bind(userDN, password, (bindErr) => {
              if (bindErr) {
                ldapclient.unbind();
                // Send a response for invalid password
                responseauth.status(401).json({
                  statusCode: 401,
                  message: "Invalid password",
                });
                return reject("Invalid password");
              }
              resolve("User authenticated successfully");
              ldapclient.unbind();
            });
          } else {
            reject("User not found");
          }
        });

        res.on("error", (err) => {
          reject("Error during LDAP search response");
        });
      });
    });
  });
};

const generateSecureOTP = () => {
  // Generate a random 3-byte buffer (24 bits) and convert it to a number
  const randomBytes = crypto.randomBytes(3); // 3 bytes = 24 bits
  const otp = randomBytes.readUIntBE(0, 3) % 1000000; // Ensure it's within 6 digits
  return otp.toString().padStart(6, "0"); // Ensure it's always 6 digits (pad with leading zeros)
};

const generateEmailHtml = (userOtp) => {
  const templatePath = path.resolve("..", "emailTemp", "otpTemplate.html");
  let emailHtml = fs.readFileSync(templatePath, "utf8");
  emailHtml = emailHtml.replace("{{otp}}", userOtp);
  return emailHtml;
};

const otpStore = {};
const emailDetails = {};

loginRouter.post("/post", async (req, res) => {
  const { USER_ID, PASSWORD, LAST_LOGIN, LOGIN_FLG } = req.body; // Extract data from the request body

  try {
   
    if(USER_ID === "" || PASSWORD === ""){
        return res.status(401).json({
          statusCode: 401,
          message: "Invalid credentials",
        });
    }

    // const result = await getPool()
    //   .request()
    //   .query(`SELECT * FROM T_EGL_USER_DETAILS WHERE USER_ID = '${USER_ID}' `);
    
    const result = await getPool()
      .request()
      .query(`SELECT A.*, B.PAGE_LINK
FROM T_EGL_USER_DETAILS A
INNER JOIN T_EGL_USER_TYPE_WEB_PAGE_LINK B ON A.USER_TYPE = B.USER_TYPE
WHERE A.USER_ID='${USER_ID}'`);
const data = result?.recordsets[0]?.length > 0 ? result.recordsets[0] : [];
    

    if (data?.length > 0) {
      // Check if the user is enabled
      if (data[0].IS_ENABLED === "N") {
        // If IS_ENABLED is 'N', the user is blocked. Send a response indicating this.
        return res.status(403).json({
          statusCode: 403,
          message: "User is blocked. Please contact the administrator.",
        });
      }

      // If the user is enabled (IS_ENABLED = 'Y'), proceed with LDAP authentication and other processes
      emailDetails["EMAIL_ID"] = data?.[0].EMAIL_ID;

      // Handle SYSTEM ADMIN user type
      if (data[0].NEED_LDAP === "N") {
        let decodedBuffer = Buffer.from(data[0].PASSWORD, "base64");
        let decodedString = decodedBuffer?.toString("utf-8");
        console.log("System Admin password check:", decodedString === PASSWORD);

        if (decodedString !== PASSWORD) {
          return res.status(401).json({
            statusCode: 401,
            message: "Invalid credentials",
          });
        }

        // For SYSTEM ADMIN, no need to authenticate via LDAP and no OTP generation or email
        return res.status(200).json({
          statusCode: 201,
          message: "Successfully logged in",
          data: data,
        });
      }

      // Handle non-SYSTEM ADMIN (LDAP authentication and OTP generation)
      if (
        data?.length > 0 &&
        data[0].NEED_LDAP === "Y"
      ) {
        console.log("LDAP TEST for non-SYSTEM ADMIN:", USER_ID, PASSWORD);

        try {
          // Call the authenticateUser function to validate LDAP credentials
          // const result1 = await authenticateUser((USER_ID).toUpperCase(), PASSWORD, res);
          // console.log(result1, "result1");

          // If LDAP authentication is successful, update the database and generate OTP
          const updatedat = await getPool()
            .request()
            .query(
              `UPDATE T_EGL_USER_DETAILS SET LOGIN_FLG = '${LOGIN_FLG}', LAST_LOGIN = '${LAST_LOGIN}' WHERE USER_ID = '${USER_ID}'`
            );

          // Generate OTP and send email
          const otp = generateSecureOTP();
          const updateOtp = await getPool()
            .request()
            .query(
              `UPDATE T_EGL_USER_DETAILS SET GENERATED_OTP = '${otp}' WHERE USER_ID = '${USER_ID}'`
            );
          otpStore[USER_ID] = otp;
          const emailTemplate = generateEmailHtml(otp);

          const mailOptions = {
            from: FROM_EMAIL,
            to: data?.[0].EMAIL_ID,
            subject: OTP_SUB,
            html: emailTemplate,
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return res
                .status(500)
                .send("Error sending email: " + error.message);
            }

            res.status(200).json({
              statusCode: 201,
              message: "Successfully logged in and OTP sent",
              data: data,
            });
          });
        } catch (err) {
          // If LDAP authentication fails, don't proceed with OTP generation or DB update.
          console.log("LDAP authentication failed: ", err);
          // The response was already sent in authenticateUser, so no further action needed.
        }
      }
    } else {
      res.status(402).json({
        statusCode: 402,
        message: "User is not Authrized and contact to Admin",
      });
    }
  } catch (err) {
    console.error("Error processing your request: ", err);
    res.status(500).json({
      message: "Error processing your request",
      error: err.message,
    });
  }
});

loginRouter.post("/resend-otp", async (req, res) => {
  const { USER_ID } = req.body;
  const otp = generateSecureOTP();
  const updateOtp = await getPool()
    .request()
    .query(
      `UPDATE T_EGL_USER_DETAILS SET GENERATED_OTP = '${otp}' WHERE USER_ID = '${USER_ID}'`
    );
  const result = await getPool()
    .request()
    .query(`SELECT * FROM T_EGL_USER_DETAILS WHERE USER_ID = '${USER_ID}' `);
  const data = result?.recordsets[0]?.length > 0 ? result.recordsets[0] : [];
  // Verify OTP
  if (data?.[0].EMAIL_ID) {
    // OTP is valid, you can clear OTP after verification (optional)
    otpStore[USER_ID] = otp;
    const emailTemplate = generateEmailHtml(otp);
    const mailOptions = {
      from: FROM_EMAIL,
      to: data?.[0].EMAIL_ID,
      subject: OTP_SUB,
      html: emailTemplate, // Use the updated HTML content
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send("Error sending email: " + error.message);
      }
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: error.message });
      }
      res.send("Email sent successfully: " + info.response);
    });
    return res.json({
      message: `Resended OTP to this ${data?.[0].EMAIL_ID} mail`,
    });
  } else {
    return res.status(400).json({ message: "getting error" });
  }
});

const otpAttempts = {};
loginRouter.post("/verify-otp", async (req, res) => {
  const { USER_ID, OTP } = req.body;
  console.log(OTP, "OTP");
  // Track OTP attempts (you can also use a session or cache to track failed attempts)
  const userAttempts = otpAttempts[USER_ID] || { attempts: 0 };

  const getOtp = await getPool()
    .request()
    .input("USER_ID", USER_ID)
    .query(
      `SELECT GENERATED_OTP FROM T_EGL_USER_DETAILS WHERE USER_ID = @USER_ID`
    );
  const getOTPValue =
    getOtp?.recordset?.length > 0 ? getOtp.recordset[0].GENERATED_OTP : "";
  const updateOtp = await getPool()
    .request()
    .query(
      `UPDATE T_EGL_USER_DETAILS SET USER_KEY_OTP = '${OTP}' WHERE USER_ID = '${USER_ID}'`
    );
  if (getOTPValue.trim() === OTP.trim()) {
    otpAttempts[USER_ID] = { attempts: 0 }; // Reset attempts after successful verification
    return res.json({ message: "OTP verified successfully" });
  } else {
    // Increment failed attempts count
    userAttempts.attempts += 1;
    otpAttempts[USER_ID] = userAttempts;
    if (userAttempts.attempts > 2) {
      const updatedat = await getPool()
        .request()
        .query(
          `UPDATE T_EGL_USER_DETAILS SET IS_ENABLED = 'N' WHERE USER_ID = '${USER_ID}'`
        );
      otpAttempts[USER_ID] = { attempts: 0 };
      return res
        .status(403)
        .json({
          message: "Too many incorrect attempts. Please contact admin.",
        });
    } else {
      return res.status(400).json({ message: "Invalid OTP" });
    }
  }
});

const sendITAdminEmailHtml = (USER_ID) => {
  const templatePath = path.resolve("..", "emailTemp", "sendItAdmin.html");
  let emailHtml = fs.readFileSync(templatePath, "utf8");
  emailHtml = emailHtml.replace("{{USER_ID}}", USER_ID);
  return emailHtml;
};

loginRouter.post("/sendMailtoAdmin", async (req, res) => {
  const { USER_ID } = req.body;
  try {
    const result = await getPool()
      .request()
      .query(
        "SELECT EMAIL_ID FROM T_EGL_USER_DETAILS WHERE USER_TYPE = 'ITADMIN'"
      );
    const updatedat = await getPool()
      .request()
      .query(
        `UPDATE T_EGL_USER_DETAILS SET IS_ENABLED = 'N' WHERE USER_ID = '${USER_ID}'`
      );
    const data = result?.recordsets[0]?.length > 0 ? result.recordsets[0] : [];
    const sendEmail = sendITAdminEmailHtml(USER_ID);
    const mailOptions = {
      from: FROM_EMAIL,
      to: data?.[0].EMAIL_ID,
      subject: SYSTEM_ERROR,
      html: sendEmail, // Use the updated HTML content
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send("Error sending email: " + error.message);
      }
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: error.message });
      }
      res.send("Email sent successfully: " + info.response);
    });
    res.json({ statusCode: 201 });
    //console.log(result, "result123")
  } catch (err) {
    res.status(500).send(err.message);
  }
});

loginRouter.post("/logout", async (req, res) => {
  const { USER_ID, LOGIN_FLG } = req.body;
  try {
    const updatedat = await getPool()
      .request()
      .query(
        `UPDATE T_EGL_USER_DETAILS SET LOGIN_FLG = '${LOGIN_FLG}' WHERE USER_ID = '${USER_ID}'`
      );
    res.json({ statusCode: 201 });
    //console.log(result, "result123")
  } catch (err) {
    res.status(500).send(err.message);
  }
});
module.exports = loginRouter;
