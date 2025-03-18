const express = require("express");
const eglAcCodeMapRouter = express.Router();
const { getPool } = require("../Database/db");
const {
  insertQuery,
  convertDatesInObject,
  updateQuery,
} = require("../utils/insertQuery");
const { transporter } = require("../utils/emailSend");
const path = require("path");
const fs = require("fs");
const { FROM_EMAIL, EGL_SUBJECT } = require("../utils/fromEmail");
const xlsx = require("xlsx");

eglAcCodeMapRouter.get("/get", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query("SELECT * FROM T_EGL_AC_CODE_MAP_INT ORDER BY EGL_CODE_ID DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

eglAcCodeMapRouter.post("/post", async (req, res) => {
  const { eglRqeqData, userDetails } = req.body;
  try {
    if (
      eglRqeqData?.MAIN_ID &&
      String(eglRqeqData.MAIN_ID).toLocaleLowerCase !== "null"
    ) {
      const eglCodeData = await getPool()
      .request()
      .query(
        `SELECT * FROM T_EGL_AC_CODE_MAP WHERE ID = ${eglRqeqData.MAIN_ID}`
      );
      const singleRec = eglCodeData.recordsets[0]
      if (eglCodeData?.recordsets?.length > 0  && singleRec[0].WORK_FLOW_STAGE !== "YES") {
        const oldCreateData = eglCodeData.recordsets[0];
        oldCreateData[0].MAIN_ID = oldCreateData[0].ID;
        delete oldCreateData[0].ID;
        oldCreateData[0].STAGE = "ORIGINAL";

        if(String(oldCreateData[0].EGL_CODE_ID).toLowerCase() === "null"){
          delete oldCreateData[0].EGL_CODE_ID;
        }
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
        if(String(oldCreateData[0].EGL_REV_DU).toLowerCase() === "null"){
          oldCreateData[0].EGL_REV_DU = "N"
        }
        delete oldCreateData[0].WORK_FLOW_STAGE;
       delete oldCreateData[0].EGL_CODE_ID
        //console.log(oldCreateData, "oldCreateData");

        const oldRecord = await getPool()
          .request()
          .query(insertQuery(oldCreateData[0], "T_EGL_AC_CODE_MAP_AUD"));
      }
      delete eglRqeqData.WORK_FLOW_STAGE
      const newRecord = await getPool()
        .request()
        .query(insertQuery(eglRqeqData, "T_EGL_AC_CODE_MAP_AUD"));
      const getlatestData = await getPool()
        .request()
        .query(
          "SELECT TOP 1 EGL_CODE_ID FROM T_EGL_AC_CODE_MAP_AUD ORDER BY EGL_CODE_ID DESC"
        );
      const getAlldata = getlatestData.recordsets[0];
      const eglIntReq = { ...eglRqeqData, ...getAlldata[0] }; 
      const count = await getPool()
        .request()
        .query(
          `SELECT COUNT(*) AS total FROM T_EGL_AC_CODE_MAP_INT WHERE MAIN_ID ='${eglRqeqData.MAIN_ID}' `
        );
        //console.log(, "count")
      if(count.recordset[0].total > 0){
        const addUserDetailsInT = await getPool()
        .request()
        .query(updateQuery(
          eglIntReq,
          "T_EGL_AC_CODE_MAP_INT",
          "MAIN_ID",
          eglRqeqData.MAIN_ID
        ));
      }else{
        const addUserDetailsInT = await getPool()
        .request()
        .query(insertQuery(eglIntReq, "T_EGL_AC_CODE_MAP_INT"));
      }
      const updateWorkFlow = await getPool()
        .request()
        .query(
          `UPDATE T_EGL_AC_CODE_MAP SET WORK_FLOW_STAGE = 'YES' WHERE ID = ${eglRqeqData.MAIN_ID}`
        );
      
    } else {
      console.log(eglRqeqData, "eglRqeqData");
      delete eglRqeqData.MAIN_ID;
      const addUserDetailsAud = await getPool()
        .request()
        .query(insertQuery(eglRqeqData, "T_EGL_AC_CODE_MAP_AUD"));
      const getlatestData = await getPool()
        .request()
        .query(
          "SELECT TOP 1 EGL_CODE_ID FROM T_EGL_AC_CODE_MAP_AUD ORDER BY EGL_CODE_ID DESC"
        );
      const getAlldata = getlatestData.recordsets[0];

      // let cleanedObject = Object.fromEntries(
      //   Object.entries(getAlldata[getAlldata.length - 1]).filter(
      //     ([key, value]) => value !== null
      //   )
      // );
      // let newObjWithCustomFormat = convertDatesInObject(cleanedObject);
      // console.log(newObjWithCustomFormat, "newObjWithCustomFormat");
      const eglIntReq = { ...eglRqeqData, ...getAlldata[0] };
      if (eglIntReq.STAGE === "CREATED") {
        const addUserDetailsInT = await getPool()
          .request()
          .query(insertQuery(eglIntReq, "T_EGL_AC_CODE_MAP_INT"));
      } else {
        const update = await getPool()
          .request()
          .query(
            updateQuery(
              eglIntReq,
              "T_EGL_AC_CODE_MAP_INT",
              "GL_AC_CODE",
              eglIntReq.GL_AC_CODE
            )
          );
      }
    }

    //console.log(addUserDetailsInT, "getlatestData");
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
    // const sendEGLEMail = eglEmailTemplate(eglRqeqData,userDetails,emailIds)
    // // Return success response
    // transporter.sendMail(sendEGLEMail, (error, info) => {
    //   if (error) {
    //     console.log(error);
    //     return res.status(500).send('Error sending email');
    //   }
    //   console.log('Email sent: ' + info.response);
    //   res.status(200).send('Email sent successfully');
    // });

    const templatePath = path.resolve(
      "..",
      "emailTemp",
      "eglEmailTemplates.html"
    );
    fs.readFile(templatePath, "utf-8", (err, data) => {
      if (err) {
        console.log(err, "fileErr");
        return res.status(500).send("Error reading the template file");
      }

      // Replace placeholders with dynamic data
      let emailContent = data;
      emailContent = emailContent.replace(
        /{{GL_AC_CODE}}/g,
        eglRqeqData.GL_AC_CODE
      );
      emailContent = emailContent.replace(
        /{{GL_AC_DESC}}/g,
        eglRqeqData.GL_AC_DESC
      );
      emailContent = emailContent.replace(
        /{{EGL_AC_CODE_SEG3}}/g,
        eglRqeqData.EGL_AC_CODE_SEG3
      );
      emailContent = emailContent.replace(
        /{{EGL_PROD_CODE_SEG4}}/g,
        eglRqeqData.EGL_PROD_CODE_SEG4
      );
      emailContent = emailContent.replace(
        /{{EGL_INT_COM_CODE_SEG5}}/g,
        eglRqeqData.EGL_INT_COM_CODE_SEG5
      );
      emailContent = emailContent.replace(
        /{{EGL_FUTURE3_SEG6}}/g,
        eglRqeqData.EGL_FUTURE3_SEG6
      );
      emailContent = emailContent.replace(
        /{{EGL_SUB_AC_SEG7}}/g,
        eglRqeqData.EGL_SUB_AC_SEG7
      );
      emailContent = emailContent.replace(
        /{{EGL_FUTURE5_SEG8}}/g,
        eglRqeqData.EGL_FUTURE5_SEG8
      );
      emailContent = emailContent.replace(
        /{{EGL_REV_DU}}/g,
        eglRqeqData.EGL_REV_DU
      );
      emailContent = emailContent.replace(/{{STAGE}}/g, eglRqeqData.STAGE);
      emailContent = emailContent.replace(
        /{{CREATED_BY}}/g,
        eglRqeqData.CREATED_BY
      );
      emailContent = emailContent.replace(
        /{{CREATE_DATE}}/g,
        String(eglRqeqData?.CREATE_DATE).toLowerCase() !== "null"
          ? eglRqeqData.CREATE_DATE
          : "NULL"
      );
      emailContent = emailContent.replace(
        /{{USER_NAME}}/g,
        userDetails.USER_NAME
      );

      // Send the email
      const mailOptions = {
        from: FROM_EMAIL,
        to: emailIds,
        subject: EGL_SUBJECT,
        html: emailContent, // Use the updated HTML content
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send("Error sending email: " + error);
        }
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: error.message });
        }
        res.send("Email sent successfully: " + info.response);
      });
    });

    res.status(200).json({
      statusCode: 201,
      message: "Data inserted successfully",
      //data: getlatestData.recordsets[0].length,
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
              <td>${user.GL_AC_CODE}</td>
              <td>${user.GL_AC_DESC}</td>
              <td>${user.EGL_AC_CODE_SEG3}</td>
              <td>${user.EGL_PROD_CODE_SEG4}</td>
              <td>${user.EGL_INT_COM_CODE_SEG5}</td>
              <td>${user.EGL_FUTURE3_SEG6}</td>
              <td>${user.EGL_SUB_AC_SEG7}</td>
              <td>${user.EGL_FUTURE5_SEG8}</td>
              <td>${user.EGL_REV_DU}</td>
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
    "eglEmailApproveTemplate.html"
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
eglAcCodeMapRouter.post("/approve", async (req, res) => {
  const { ReqData, USER_NAME } = req.body; // Extract data from the request body
  const fileReq = ReqData;
  console.log(ReqData, "ReqData");
  const exelDownloadData = [];

  try {
    for (const key in ReqData) {
      exelDownloadData.push(ReqData[key]);

      if (String(ReqData[key].CREATE_DATE).toLowerCase() === "null") {
        delete ReqData[key].CREATE_DATE;
      }
      if (String(ReqData[key].CREATED_BY).toLowerCase() === "null") {
        delete ReqData[key].CREATED_BY;
      }

      if (
        ReqData[key]?.MAIN_ID &&
        String(ReqData[key].MAIN_ID).toLowerCase() !== "null"
      ) {
        const addUserDetailsAud = await getPool()
          .request()
          .query(insertQuery(ReqData[key], "T_EGL_AC_CODE_MAP_AUD"));
          const getlatestData = await getPool()
          .request()
          .query(
            "SELECT TOP 1 EGL_CODE_ID FROM T_EGL_AC_CODE_MAP_AUD ORDER BY EGL_CODE_ID DESC"
          );
        const getAlldata = getlatestData.recordsets[0];

        //console.log(newObjWithCustomFormat, "newObjWithCustomFormat");
        const eglReq = { ...ReqData[key], ...getAlldata[0] };
        delete eglReq.MAIN_ID;
        eglReq.WORK_FLOW_STAGE = null
        
          const updateEglCode = await getPool()
          .request()
          .query(updateQuery(eglReq, "T_EGL_AC_CODE_MAP","ID", ReqData[key].MAIN_ID ));
       
        const addUserDetailsInT = await getPool()
          .request()
          .query(
            `DELETE FROM T_EGL_AC_CODE_MAP_INT WHERE MAIN_ID = '${ReqData[key].MAIN_ID}'`
          );
      } else {
        if (ReqData[key].STAGE === "APPROVED") {

          delete ReqData[key].MAIN_ID
        const addUserDetailsAud = await getPool()
          .request()
          .query(insertQuery(ReqData[key], "T_EGL_AC_CODE_MAP_AUD"));

        const getlatestData = await getPool()
          .request()
          .query(
            "SELECT TOP 1 EGL_CODE_ID FROM T_EGL_AC_CODE_MAP_AUD ORDER BY EGL_CODE_ID DESC"
          );
        const getAlldata = getlatestData.recordsets[0];
        const eglReq = { ...ReqData[key], ...getAlldata[0] };
        const addUserDetails = await getPool()
          .request()
          .query(insertQuery(eglReq, "T_EGL_AC_CODE_MAP"));
          const addUserDetailsInT = await getPool()
            .request()
            .query(
              `DELETE FROM T_EGL_AC_CODE_MAP_INT WHERE GL_AC_CODE = '${ReqData[key].GL_AC_CODE}'`
            );
         }
         else {
          delete ReqData[key].MAIN_ID
        const addUserDetailsAud = await getPool()
          .request()
          .query(insertQuery(ReqData[key], "T_EGL_AC_CODE_MAP_AUD"));
        }
      }

      //console.log(addUserDetailsInT, "getlatestData")
      // Return success response
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
      subject: EGL_SUBJECT,
      html: emailTemplate, // Use the updated HTML content
      attachments: [
        {
          filename: "eglCodeApproved.xlsx",
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

eglAcCodeMapRouter.get("/getAud", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query("SELECT * FROM T_EGL_AC_CODE_MAP_AUD ORDER BY EGL_CODE_ID DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

eglAcCodeMapRouter.get("/getAllData", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query("SELECT * FROM T_EGL_AC_CODE_MAP");
    console.log(result.recordset)
    const data = result?.recordset.length > 0 ? result.recordset.filter(item =>item.EGL_AC_CODE_SEG3 !== "1322520") : []
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

eglAcCodeMapRouter.get("/eglDesc", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query(
        "SELECT EGL_ACC, SEG3_DESC_ACC, EGL_PROD FROM T_EGL_HO_INBOUND_COA_DAT"
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = eglAcCodeMapRouter;
