const express = require("express");
const unitCodeMapRouter = express.Router();
const { getPool } = require("../Database/db");
const { insertQuery, updateQuery } = require("../utils/insertQuery");
const { transporter } = require("../utils/emailSend");
const path = require("path");
const fs = require("fs");
const { FROM_EMAIL, UNIT_SUBJECT } = require("../utils/fromEmail");
const xlsx = require("xlsx");


unitCodeMapRouter.get("/get", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query(
        "SELECT * FROM T_EGL_UNIT_CODE_MAP_INT ORDER BY UNIT_CODE_ID DESC"
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

unitCodeMapRouter.get("/getAllData", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query("SELECT * FROM T_EGL_UNIT_CODE_MAP");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

unitCodeMapRouter.get("/getAud", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query(
        "SELECT * FROM T_EGL_UNIT_CODE_MAP_AUD ORDER BY UNIT_CODE_ID DESC"
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

unitCodeMapRouter.post("/post", async (req, res) => {
  const { unitRqeqData, userDetails } = req.body; // Extract data from the request body
  try {
    if (
      unitRqeqData?.MAIN_ID &&
      String(unitRqeqData.MAIN_ID).toLocaleLowerCase !== "null"
    ) {
      const unitCodeData = await getPool()
        .request()
        .query(
          `SELECT * FROM T_EGL_UNIT_CODE_MAP WHERE ID = ${unitRqeqData.MAIN_ID}`
        );
        const singleRec = unitCodeData.recordsets[0]
      if(unitCodeData?.recordsets?.length > 0 && singleRec[0].WORK_FLOW_STAGE !== "YES"){
        const oldCreateData = unitCodeData.recordsets[0];
        oldCreateData[0].MAIN_ID = oldCreateData[0].ID;
        delete oldCreateData[0].ID;
        oldCreateData[0].STAGE = "ORIGINAL";
        delete oldCreateData[0].UNIT_CODE_ID;
        if(String(oldCreateData[0].CREATE_DATE).toLowerCase() === "null"){
          delete oldCreateData[0].CREATE_DATE;
        }else {
          oldCreateData[0].CREATE_DATE = (oldCreateData[0].CREATE_DATE).toISOString().split('T')[0]
        }
        if(String(oldCreateData[0].MODIFY_DATE).toLowerCase() === "null"){
          delete oldCreateData[0].MODIFY_DATE;
        }else {
          oldCreateData[0].MODIFY_DATE = (oldCreateData[0].MODIFY_DATE).toISOString().split('T')[0]
        }
        if(String(oldCreateData[0].UNIT_CODE_ID).toLowerCase() === "null"){
          delete oldCreateData[0].UNIT_CODE_ID;
        }
        delete oldCreateData[0].WORK_FLOW_STAGE;

        //console.log(oldCreateData, "oldCreateData");

        const oldRecord = await getPool()
          .request()
          .query(insertQuery(oldCreateData[0], "T_EGL_UNIT_CODE_MAP_AUD"));
      }
      delete unitRqeqData.WORK_FLOW_STAGE
      const newRecord = await getPool()
        .request()
        .query(insertQuery(unitRqeqData, "T_EGL_UNIT_CODE_MAP_AUD"));
      const getlatestData = await getPool()
        .request()
        .query(
          "SELECT TOP 1 UNIT_CODE_ID FROM T_EGL_UNIT_CODE_MAP_AUD ORDER BY UNIT_CODE_ID DESC"
        );
      const getAlldata = getlatestData.recordsets[0];
      const eglIntReq = { ...unitRqeqData, ...getAlldata[0] };
      const count = await getPool()
        .request()
        .query(
          `SELECT COUNT(*) AS total FROM T_EGL_UNIT_CODE_MAP_INT WHERE MAIN_ID ='${unitRqeqData.MAIN_ID}' `
        );
        if(count.recordset[0].total > 0){
          const addUserDetailsInT = await getPool()
          .request()
          .query(updateQuery(
            eglIntReq,
            "T_EGL_UNIT_CODE_MAP_INT",
            "MAIN_ID",
            unitRqeqData.MAIN_ID
          ));
        }else{
          const addUserDetailsInT = await getPool()
          .request()
          .query(insertQuery(eglIntReq, "T_EGL_UNIT_CODE_MAP_INT"));
        }
        const updateWorkFlow = await getPool()
      .request()
      .query(
        `UPDATE T_EGL_UNIT_CODE_MAP SET WORK_FLOW_STAGE = 'YES' WHERE ID = ${unitRqeqData.MAIN_ID}`
      );

    } else {
      if(String(unitRqeqData.MAIN_ID) === "null"){
        delete unitRqeqData.MAIN_ID
      }
      const addUserDetailsAud = await getPool()
        .request()
        .query(insertQuery(unitRqeqData, "T_EGL_UNIT_CODE_MAP_AUD"));
      const getlatestData = await getPool()
        .request()
        .query(
          "SELECT TOP 1 UNIT_CODE_ID FROM T_EGL_UNIT_CODE_MAP_AUD ORDER BY UNIT_CODE_ID DESC"
        );
      const getAlldata = getlatestData.recordsets[0];
      const eglIntReq = { ...unitRqeqData, ...getAlldata[0] };
      if (eglIntReq.STAGE === "CREATED") {
        const addUserDetailsInT = await getPool()
          .request()
          .query(insertQuery(eglIntReq, "T_EGL_UNIT_CODE_MAP_INT"));
      } else {
        const update = await getPool()
          .request()
          .query(
            updateQuery(
              eglIntReq,
              "T_EGL_UNIT_CODE_MAP_INT",
              "COM_UNIT_CODE_SEG4",
              eglIntReq.COM_UNIT_CODE_SEG4
            )
          );
      }
    }

    const parameterRev = await getPool()
      .request()
      .query(
        `SELECT EMAIL_ID FROM T_EGL_USER_DETAILS WHERE USER_TYPE = 'PARAMETER REVIEWER'`
      );
    //console.log(parameterRev.recordsets,"parameterRev")
    const emailIds = parameterRev?.recordsets
      .flat()
      .map((item) => item.EMAIL_ID);
    console.log(emailIds, "emailIds");
    const templatePath = path.resolve(
      "..",
      "emailTemp",
      "unitEmailTemplate.html"
    );
    fs.readFile(templatePath, "utf-8", (err, data) => {
      if (err) {
        console.log(err, "fileErr");
        return res.status(500).send("Error reading the template file");
      }

      // Replace placeholders with dynamic data
      let emailContent = data;
      emailContent = emailContent.replace(
        /{{COM_UNIT_CODE_SEG4}}/g,
        unitRqeqData.COM_UNIT_CODE_SEG4
      );
      emailContent = emailContent.replace(
        /{{EGL_RC_SEG2}}/g,
        unitRqeqData.EGL_RC_SEG2
      );
      emailContent = emailContent.replace(
        /{{UNIT_CODE_DESC}}/g,
        unitRqeqData.UNIT_CODE_DESC
      );
      emailContent = emailContent.replace(/{{RC_DESC}}/g, unitRqeqData.RC_DESC);
      emailContent = emailContent.replace(/{{STAGE}}/g, unitRqeqData.STAGE);
      emailContent = emailContent.replace(/{{CREATED_BY}}/g, unitRqeqData.CREATED_BY);
      emailContent = emailContent.replace(
        /{{CREATE_DATE}}/g,
        unitRqeqData.CREATE_DATE
      );
      emailContent = emailContent.replace(
        /{{USER_NAME}}/g,
        userDetails.USER_NAME
      );

      // Send the email
      const mailOptions = {
        from: FROM_EMAIL,
        to: emailIds,
        subject: UNIT_SUBJECT,
        html: emailContent, // Use the updated HTML content
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send("Error sending email: " + error);
        }
        res.send("Email sent successfully: " + info.response);
      });
    });
    // const sendEGLEMail = unitEmailTemplate(unitRqeqData,userDetails,emailIds)
    // // Return success response
    // transporter.sendMail(sendEGLEMail, (error, info) => {
    //   if (error) {
    //     console.log(error);
    //     return res.status(500).send('Error sending email');
    //   }
    //   console.log('Email sent: ' + info.response);
    //   res.status(200).send('Email sent successfully');
    // });
    // Return success response
    res.status(200).json({
      statusCode: 201,
      message: "Data inserted successfully",
     // data: getlatestData.recordsets[0].length,
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
                <td>${user.COM_UNIT_CODE_SEG4}</td>
                <td>${user.EGL_RC_SEG2}</td>
                <td>${user.UNIT_CODE_DESC}</td>
                <td>${user.RC_DESC}</td>
                <td>${user.STAGE}</td>
                <td>${user.CREATED_BY}</td>
                <td>${user.APPROVED_BY}</td>
                <td>${user.ACTION_COMMENTS}</td>
                <td>${user.CREATE_DATE}</td>
                <td>${user.MODIFY_DATE}</td> 
              </tr>`
    )
    .join("");
};

const generateEmailHtml = (users, USER_NAME) => {
  const templatePath = path.resolve(
    "..",
    "emailTemp",
    "unitCodeMapApproveTemp.html"
  );
  let emailHtml = fs.readFileSync(templatePath, "utf8");
  const userRows = generateUserRows(users);
  emailHtml = emailHtml.replace("{{parameters}}", userRows);
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

unitCodeMapRouter.post("/approve", async (req, res) => {
  const { ReqData, USER_NAME } = req.body; // Extract data from the request body
  const fileReq = ReqData;
  // const requestData = { ...usersAudit, ...req.body };
  // console.log(requestData, "requestData");
  if(String(ReqData.CREATE_DATE).toLowerCase() === 'null'){
   delete ReqData.CREATE_DATE
  }
  const exelDownloadData = [];
  try {
    for (const key in ReqData) {
      exelDownloadData.push(ReqData[key]);
      if(String(ReqData[key].CREATE_DATE).toLowerCase() === 'null' ){
        delete ReqData[key].CREATE_DATE
      }
      if(String(ReqData[key].CREATED_BY).toLowerCase() === 'null' ){
        delete ReqData[key].CREATED_BY
      }
      if (
        ReqData[key]?.MAIN_ID &&
        String(ReqData[key].MAIN_ID).toLowerCase() !== "null"
      ) {

        const addUserDetailsAud = await getPool()
        .request()
        .query(insertQuery(ReqData[key], "T_EGL_UNIT_CODE_MAP_AUD"));
        const getlatestData = await getPool()
        .request()
        .query(
          "SELECT TOP 1 UNIT_CODE_ID FROM T_EGL_UNIT_CODE_MAP_AUD ORDER BY UNIT_CODE_ID DESC"
        );
      const getAlldata = getlatestData.recordsets[0];

      //console.log(newObjWithCustomFormat, "newObjWithCustomFormat");
      const cmpReq = { ...ReqData[key], ...getAlldata[0] };
      delete cmpReq.MAIN_ID;
      cmpReq.WORK_FLOW_STAGE = null
      
        const updateEglCode = await getPool()
        .request()
        .query(updateQuery(cmpReq, "T_EGL_UNIT_CODE_MAP","ID", ReqData[key].MAIN_ID ));
     
      const addUserDetailsInT = await getPool()
        .request()
        .query(
          `DELETE FROM T_EGL_UNIT_CODE_MAP_INT WHERE MAIN_ID = '${ReqData[key].MAIN_ID}'`
        );
      }else {
        if (ReqData[key].STAGE === "APPROVED") {
          delete ReqData[key].MAIN_ID
        const addUserDetailsAud = await getPool()
          .request()
          .query(insertQuery(ReqData[key], "T_EGL_UNIT_CODE_MAP_AUD"));

        const getlatestData = await getPool()
          .request()
          .query(
            "SELECT TOP 1 UNIT_CODE_ID FROM T_EGL_UNIT_CODE_MAP_AUD ORDER BY UNIT_CODE_ID DESC"
          );
        const getAlldata = getlatestData.recordsets[0];
        const cmpReq = { ...ReqData[key], ...getAlldata[0] };
        const addUserDetails = await getPool()
          .request()
          .query(insertQuery(cmpReq, "T_EGL_UNIT_CODE_MAP"));
          const addUserDetailsInT = await getPool()
            .request()
            .query(
              `DELETE FROM T_EGL_UNIT_CODE_MAP_INT WHERE COM_UNIT_CODE_SEG4 = '${ReqData[key].COM_UNIT_CODE_SEG4}'`
            );
        }else {
          delete ReqData[key].MAIN_ID
        const addUserDetailsAud = await getPool()
          .request()
          .query(insertQuery(ReqData[key], "T_EGL_UNIT_CODE_MAP_AUD"));
        }

      }

    }

    const parameterRev = await getPool()
      .request()
      .query(
        `SELECT EMAIL_ID FROM T_EGL_USER_DETAILS WHERE USER_TYPE = 'PARAMETER PREPARER'`
      );
    //console.log(parameterRev.recordsets,"parameterRev")
    const emailIds = parameterRev?.recordsets
      .flat()
      .map((item) => item.EMAIL_ID);
    console.log(emailIds, "emailIds");
    const dataArray = Object.values(fileReq);
    // exelDownloadData.push(dataArray)
    const excelFilePath = convertJsonToExcel(exelDownloadData);
    const emailTemplate = generateEmailHtml(
      dataArray,
      USER_NAME,
      excelFilePath
    );
    const mailOptions = {
      from: FROM_EMAIL,
      to: emailIds,
      subject: UNIT_SUBJECT,
      html: emailTemplate, // Use the updated HTML content
      attachments: [
        {
          filename: "unitApproved.xlsx",
          path: excelFilePath, // Path to the generated Excel file
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send("Error sending email: " + error.message);
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

module.exports = unitCodeMapRouter;
