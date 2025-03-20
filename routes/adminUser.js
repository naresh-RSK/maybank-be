const express = require("express");
const adminUserRouter = express.Router();
const { getPool } = require("../Database/db");
const { insertQuery, convertDatesInObject } = require("../utils/insertQuery");
const { usersAudit } = require("../utils/UsersData");
const { FROM_EMAIL, USER_SUBJECT, USER_APPROVE_STATUS } = require("../utils/fromEmail");
const { transporter } = require("../utils/emailSend");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");
// loginRouter.post('/post',async(request,response)=>{

//     try{
//         const token = jwt.sign({id:request.body._id},'secret')
//         const states = await Signup.findById(request.body._id);
//         response.status(200).json({data:states,token:token})
//     }catch(err){
//      response.status(400).send(err)
//     }

// })
// loginRouter.post('/verify',async(request,response)=>{

//     try{
//         const token = request.header("Authorization");
//         const verifydata = jwt.decode(token)
//         const states = await Signup.findById(verifydata.id);
//         response.status(200).json(states)
//     }catch(err){
//      response.status(400).send(err)
//     }

// })
adminUserRouter.get("/getIntData", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query("SELECT * FROM T_EGL_USER_DETAILS_INT");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// adminUserRouter.post("/post", async (req, res) => {
//   const { name, age } = req.body; // Extract data from the request body

//   try {
//     // Connect to the MSSQL database
//     //await sql.connect(dbConfig);

//     // SQL query to insert data
//     //   const result = await getPool().request().query(`
//     //     INSERT INTO Persons (PersonID, LastName, Address, City)
//     //     VALUES ('${name}', ${age})
//     //   `);
//     //const { name, age } = req.body;  // Assuming `name` and `age` come from the request body
//     const keys = Object.keys(req.body);
//     const requestKeys = keys.join(",");
//     const replacedArray = keys.map(() => "?");
//     const requestSymbol = replacedArray.join(",");
//     const values = Object.keys(req.body).map((key) => req.body[key]);
//     const requestValues = values.map((item) => `'${item}'`).join(", ");
//     console.log(requestKeys);
//     console.log(requestSymbol, "replacedArray");
//     console.log(requestValues, "values");
//     console.log(
//       `INSERT INTO Persons (${requestKeys}) VALUES (${requestValues})`
//     );
//     const result = await getPool().request().query(insertQuery(req.body));

//     // Return success response
//     res.status(200).json({
//       message: "Data inserted successfully",
//       data: req.body,
//     });
//   } catch (err) {
//     console.error("Error inserting data: ", err);
//     res.status(500).json({
//       message: "Error inserting data into the database",
//       error: err.message,
//     });
//   }
// });

// 

adminUserRouter.post("/user/post", async (req, res) => {
  const {reqUser, userDetails} = req.body
  try {
    // Check if USER_ID already exists in T_EGL_USER_DETAILS table
    
    

    // If USER_ID does not exist, proceed with inserting data into all tables
    if (((reqUser.CREATED_BY).toUpperCase() === "SYSTEM ADMIN") && (reqUser.USER_TYPE === "USER AUTHORIZER" || reqUser.USER_TYPE === "USER ADMINISTRATOR")) {
      const userIdExists = await getPool()
      .request()
      .input('USER_ID', reqUser.USER_ID)  // Assuming USER_ID is coming from the request body
      .query("SELECT COUNT(*) AS count FROM T_EGL_USER_DETAILS WHERE USER_ID = @USER_ID");

    // If USER_ID exists, return a response with a message
    if (userIdExists.recordset[0].count > 0) {
      return res.status(409).json({
        message: `${reqUser.USER_ID} already exists`
      });
    }
      
      // Insert into T_EGL_USER_DETAILS if the condition is met
      const addUserDetailsInT = await getPool()
        .request()
        .query(insertQuery(reqUser, "T_EGL_USER_DETAILS"));
      
    } else {

      const userIdExists = await getPool()
      .request()
      .input('USER_ID', reqUser.USER_ID)  // Assuming USER_ID is coming from the request body
      .query("SELECT COUNT(*) AS count FROM T_EGL_USER_DETAILS_AUD WHERE USER_ID = @USER_ID");

    // If USER_ID exists, return a response with a message
    if (userIdExists.recordset[0].count > 0) {
      return res.status(409).json({
        message: `${reqUser.USER_ID} already exists`
      });
    }
      // Insert into T_EGL_USER_DETAILS_AUD
      const addUserDetailsAud = await getPool()
        .request()
        .query(insertQuery(reqUser, "T_EGL_USER_DETAILS_AUD"));

      // Get the latest AUD_ID
      const getlatestData = await getPool()
        .request()
        .query("SELECT TOP 1 AUD_ID FROM T_EGL_USER_DETAILS_AUD ORDER BY AUD_ID DESC");

      const getAlldata = getlatestData.recordsets[0];
      const userIntReq = {...reqUser, ...getAlldata[0]};

      // Insert into T_EGL_USER_DETAILS_INT
      const addUserDetailsInT = await getPool()
        .request()
        .query(insertQuery(userIntReq, "T_EGL_USER_DETAILS_INT"));

      const userAuth = await getPool()
      .request()
      .query(
        `SELECT EMAIL_ID FROM T_EGL_USER_DETAILS WHERE USER_TYPE = 'USER AUTHORIZER'`
      );
    //console.log(parameterRev.recordsets,"parameterRev")
    const emailIds = userAuth?.recordsets
      .flat()
      .map((item) => item.EMAIL_ID);
    console.log(emailIds, "emailIds");
    const templatePath = path.resolve(
      "..",
      "emailTemp",
      "userEmailTemp.html"
    );
    fs.readFile(templatePath, "utf-8", (err, data) => {
      if (err) {
        console.log(err, "fileErr");
        return res.status(500).send("Error reading the template file");
      }

      // Replace placeholders with dynamic data
      let emailContent = data;
      emailContent = emailContent.replace(
        /{{USER_ID}}/g,
        reqUser.USER_ID
      );
      emailContent = emailContent.replace(
        /{{USER_NAME}}/g,
        reqUser.FIRST_NAME +" "+ reqUser.LAST_NAME
      );
      emailContent = emailContent.replace(
        /{{DESIGNATION}}/g,
        reqUser.DESIGNATION
      );
      emailContent = emailContent.replace(
        /{{EMAIL_ID}}/g,
        reqUser.EMAIL_ID
      );
      emailContent = emailContent.replace(
        /{{DIV_DEPT_UNIT}}/g,
        reqUser.DIV_DEPT_UNIT
      );
      emailContent = emailContent.replace(
        /{{IS_ENABLED}}/g,
        reqUser.IS_ENABLED
      );
      emailContent = emailContent.replace(/{{STAGE}}/g, reqUser.STAGE);
      emailContent = emailContent.replace(
        /{{START_DATE}}/g,
        reqUser.START_DATE
      );
      emailContent = emailContent.replace(
        /{{FROM_NAME}}/g,
        userDetails.USERNAME
      );
      
      // Send the email
      const mailOptions = {
        from: FROM_EMAIL,
        to: emailIds,
        subject: USER_SUBJECT,
        html: emailContent, // Use the updated HTML content
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send("Error sending email: " + error);
        }
        res.send("Email sent successfully: " + info.response);
      });
    });
    }

    // Return success response
    res.status(200).json({
      statusCode: 201,
      message: "Data inserted successfully",
    });

  } catch (err) {
    console.error("Error inserting data: ", err);
    res.status(500).json({
      message: "Error inserting data into the database",
      error: err.message,
    });
  }
});

const generateUserRows = (users) => {
  return users
    .map(
      (user) => `
      <tr>
              <td>${user.USER_ID}</td>
              <td>${user.FIRST_NAME}   ${user.LAST_NAME}</td>
              <td>${user.EMAIL_ID}</td>
              <td>${user.IS_ENABLED}</td>
              <td>${user.USER_TYPE}</td>
              <td>${user.CREATED_BY}</td>
              <td>${user.STAGE}</td>
              <td>${user.ACTION_COMMENTS}</td>
              <td>${user.START_DATE}</td>
              <td>${user.MODIFY_DATE}</td>
              
            </tr>`
    )
    .join("");
};

const generateEmailHtml = (users, USER_NAME) => {
  const templatePath = path.resolve(
    "..",
    "emailTemp",
    "userApproveEmailTemp.html"
  );
  let emailHtml = fs.readFileSync(templatePath, "utf8");
  const userRows = generateUserRows(users);
  emailHtml = emailHtml.replace("{{userData}}", userRows);
  emailHtml = emailHtml.replace("{{USER_NAME}}", USER_NAME);
  return emailHtml;
};

const convertJsonToExcel = (data) => {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Sheet1");

  // Save the Excel file to a path (in this case, a temporary file)
  const filePath = path.resolve(__dirname, "temp.xlsx");
  xlsx.writeFile(wb, filePath);

  return filePath;
};

adminUserRouter.post("/user/approve", async (req, res) => {
  const {reqData,userDetails} = req.body
  // const { name, age } = req.body; // Extract data from the request body
  // const requestData = { ...usersAudit, ...req.body };
  // console.log(requestData, "requestData");
  const exelDownloadData = [];
  try {
    const addUserDetailsInT = await getPool()
      .request()
      .query(
        `DELETE FROM T_EGL_USER_DETAILS_INT WHERE USER_ID = '${reqData.USER_ID}'`
      );
    const addUserDetailsAud = await getPool()
      .request()
      .query(insertQuery(reqData, "T_EGL_USER_DETAILS_AUD"));
      const getlatestData = await getPool()
      .request()
      .query("SELECT TOP 1 AUD_ID FROM T_EGL_USER_DETAILS_AUD ORDER BY AUD_ID DESC");
    const getAlldata = getlatestData.recordsets[0];

    // let cleanedObject = Object.fromEntries(
    //   Object.entries(getAlldata[getAlldata.length - 1]).filter(
    //     ([key, value]) => value !== null
    //   )
    // );
    // let newObjWithCustomFormat = convertDatesInObject(cleanedObject);
   // console.log(newObjWithCustomFormat, "newObjWithCustomFormat");
   const userDetailsReq = {...reqData, ...getAlldata[0] }
    const addUserDetails = await getPool()
      .request()
      .query(insertQuery(userDetailsReq, "T_EGL_USER_DETAILS"));


      const userAdmin = await getPool()
      .request()
      .query(
        `SELECT EMAIL_ID FROM T_EGL_USER_DETAILS WHERE USER_TYPE = 'USER ADMINISTRATOR'`
      );
    //console.log(parameterRev.recordsets,"parameterRev")
    const emailIds = userAdmin?.recordsets
      .flat()
      .map((item) => item.EMAIL_ID);
    console.log(emailIds, "emailIds");
    //const dataArray = Object.values(reqData);
     exelDownloadData.push(reqData)
    const excelFilePath = convertJsonToExcel(exelDownloadData);
    const emailTemplate = generateEmailHtml(
      exelDownloadData,
      userDetails.USER_NAME,
      excelFilePath
    );
    const mailOptions = {
      from: FROM_EMAIL,
      to: emailIds,
      subject: USER_APPROVE_STATUS,
      html: emailTemplate, // Use the updated HTML content
      attachments: [
        {
          filename: "userApproved.xlsx",
          path: excelFilePath, // Path to the generated Excel file
        },
      ],
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

    //console.log(addUserDetailsInT, "getlatestData")
    // Return success response
    res.status(200).json({
      statusCode: 201,
      message: "Approved Successfully",
      //data: getlatestData.recordsets[0].length
    });
  } catch (err) {
    console.error("Error inserting data: ", err);
    res.status(500).json({
      message: "Error inserting data into the database",
      error: err.message,
    });
  }
});
adminUserRouter.get("/userAllDetails", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query("SELECT * FROM T_EGL_USER_DETAILS");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

adminUserRouter.post("/userDetails/:id", async (req, res) => {
  try {
    const userId = req.params.id
    const result = await getPool()
      .request()
      .query(`SELECT * FROM T_EGL_USER_DETAILS_AUD WHERE USER_ID ='${userId}'`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


module.exports = adminUserRouter;
