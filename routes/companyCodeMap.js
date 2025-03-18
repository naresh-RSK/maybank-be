const express = require("express");
const companyCodeMapRouter = express.Router();
const { getPool } = require("../Database/db");
const { insertQuery, updateQuery } = require("../utils/insertQuery");
const { transporter } = require("../utils/emailSend");
const path = require("path");
const fs = require("fs");
const {shortNames} = require("../utils/shortName")
const { FROM_EMAIL, COMPANY_SUBJECT } = require("../utils/fromEmail");
const xlsx = require("xlsx");

companyCodeMapRouter.get("/get", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query(
        "SELECT * FROM T_EGL_COMPANY_CODE_MAP_INT ORDER BY COMPANY_CODE_ID DESC"
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

companyCodeMapRouter.post("/post", async (req, res) => {
  const { cmpRqeqData, userDetails } = req.body; // Extract data from the request body
  // const requestData = { ...usersAudit, ...req.body };
  //console.log(requestData, "requestData");
  const shortnameValue = shortNames.find(item => item.COM_COA_SEG1 === cmpRqeqData.COM_COA_SEG1 && item.COM_UNIT_CODE_SEG4 === String(cmpRqeqData.COM_UNIT_CODE_SEG4).toLowerCase())
  const reqCmpData = {...cmpRqeqData, ...shortnameValue }
 if(String(reqCmpData?.COM_UNIT_CODE_SEG4).toLowerCase() === "null"){
  delete reqCmpData.COM_UNIT_CODE_SEG4
 }
 
 if(String(cmpRqeqData?.MAIN_ID).toLocaleLowerCase() === "null"){
  delete reqCmpData.MAIN_ID;
 }
 if(String(reqCmpData?.SHORTNAME).toLowerCase() === "null"){
  delete reqCmpData.SHORTNAME
 }
 //console.log(reqCmpData, "reqCmpData")
  try {
    if (
      cmpRqeqData?.MAIN_ID &&
      String(cmpRqeqData.MAIN_ID).toLocaleLowerCase !== "null"
    ) {
      const companyCodeData = await getPool()
        .request()
        .query(
          `SELECT * FROM T_EGL_COMPANY_CODE_MAP WHERE ID = ${cmpRqeqData.MAIN_ID}`
        );
        const singleRec = companyCodeData.recordsets[0]
      if(companyCodeData?.recordsets?.length > 0 && singleRec[0].WORK_FLOW_STAGE !== "YES"){
        const oldCreateData = companyCodeData.recordsets[0];
        oldCreateData[0].MAIN_ID = oldCreateData[0].ID;
        delete oldCreateData[0].ID;
        delete oldCreateData[0].COMPANY_CODE_ID;
        oldCreateData[0].STAGE = "ORIGINAL";
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
        delete oldCreateData[0].WORK_FLOW_STAGE;
        if(String(oldCreateData[0].COM_UNIT_CODE_SEG4).toLowerCase() === "null"){
          delete oldCreateData[0].COM_UNIT_CODE_SEG4;
        }
        if(String(oldCreateData[0].COMPANY_CODE_ID).toLowerCase() === "null"){
          delete oldCreateData[0].COMPANY_CODE_ID;
        }
        

        //console.log(oldCreateData, "oldCreateData");

        const oldRecord = await getPool()
          .request()
          .query(insertQuery(oldCreateData[0], "T_EGL_COMPANY_CODE_MAP_AUD"));
      }
      delete reqCmpData.WORK_FLOW_STAGE
      const newRecord = await getPool()
        .request()
        .query(insertQuery(reqCmpData, "T_EGL_COMPANY_CODE_MAP_AUD"));
      const getlatestData = await getPool()
        .request()
        .query(
          "SELECT TOP 1 COMPANY_CODE_ID FROM T_EGL_COMPANY_CODE_MAP_AUD ORDER BY COMPANY_CODE_ID DESC"
        );
      const getAlldata = getlatestData.recordsets[0];
      const eglIntReq = { ...reqCmpData, ...getAlldata[0] }; 
      const count = await getPool()
        .request()
        .query(
          `SELECT COUNT(*) AS total FROM T_EGL_COMPANY_CODE_MAP_INT WHERE MAIN_ID ='${cmpRqeqData.MAIN_ID}' `
        );
        //console.log(, "count")
      if(count.recordset[0].total > 0){
        const addUserDetailsInT = await getPool()
        .request()
        .query(updateQuery(
          eglIntReq,
          "T_EGL_COMPANY_CODE_MAP_INT",
          "MAIN_ID",
          cmpRqeqData.MAIN_ID
        ));
      }else{
        const addUserDetailsInT = await getPool()
        .request()
        .query(insertQuery(eglIntReq, "T_EGL_COMPANY_CODE_MAP_INT"));
      }
      const updateWorkFlow = await getPool()
      .request()
      .query(
        `UPDATE T_EGL_COMPANY_CODE_MAP SET WORK_FLOW_STAGE = 'YES' WHERE ID = ${cmpRqeqData.MAIN_ID}`
      );
        
    }else {
      console.log(cmpRqeqData, "cmpRqeqData");
      
      const addUserDetailsAud = await getPool()
        .request()
        .query(insertQuery(reqCmpData, "T_EGL_COMPANY_CODE_MAP_AUD"));
      const getlatestData = await getPool()
        .request()
        .query(
          "SELECT TOP 1 COMPANY_CODE_ID FROM T_EGL_COMPANY_CODE_MAP_AUD ORDER BY COMPANY_CODE_ID DESC"
        );
      const getAlldata = getlatestData.recordsets[0];

      // let cleanedObject = Object.fromEntries(
      //   Object.entries(getAlldata[getAlldata.length - 1]).filter(
      //     ([key, value]) => value !== null
      //   )
      // );
      // let newObjWithCustomFormat = convertDatesInObject(cleanedObject);
      // console.log(newObjWithCustomFormat, "newObjWithCustomFormat");
      const eglIntReq = { ...reqCmpData, ...getAlldata[0] };
      if (eglIntReq.STAGE === "CREATED") {
        const addUserDetailsInT = await getPool()
          .request()
          .query(insertQuery(eglIntReq, "T_EGL_COMPANY_CODE_MAP_INT"));
      } else {
        const update = await getPool()
          .request()
          .query(
            updateQuery(
              eglIntReq,
              "T_EGL_COMPANY_CODE_MAP_INT",
              "COM_COA_SEG1",
              eglIntReq.COM_COA_SEG1
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
      "companyEmailTemplate.html"
    );
    fs.readFile(templatePath, "utf-8", (err, data) => {
      if (err) {
        console.log(err, "fileErr");
        return res.status(500).send("Error reading the template file");
      }

      // Replace placeholders with dynamic data
      let emailContent = data;
      emailContent = emailContent.replace(
        /{{COM_COA_SEG1}}/g,
        cmpRqeqData.COM_COA_SEG1
      );
      emailContent = emailContent.replace(
        /{{COM_UNIT_CODE_SEG4}}/g,
        cmpRqeqData.COM_UNIT_CODE_SEG4
      );
      emailContent = emailContent.replace(
        /{{COM_DESC}}/g,
        cmpRqeqData.COM_DESC
      );
      emailContent = emailContent.replace(
        /{{EGL_ENT_SEG1}}/g,
        cmpRqeqData.EGL_ENT_SEG1
      );
      emailContent = emailContent.replace(
        /{{EGL_ENT_NAME}}/g,
        cmpRqeqData.EGL_ENT_NAME
      );
      emailContent = emailContent.replace(
        /{{IS_ENABLED}}/g,
        cmpRqeqData.IS_ENABLED
      );
      emailContent = emailContent.replace(/{{CREATED_BY}}/g, cmpRqeqData.CREATED_BY);
      emailContent = emailContent.replace(/{{STAGE}}/g, cmpRqeqData.STAGE);
      emailContent = emailContent.replace(
        /{{CREATE_DATE}}/g,
        cmpRqeqData.CREATE_DATE
      );
      emailContent = emailContent.replace(
        /{{SHORTNAME}}/g,
        reqCmpData.SHORTNAME
      );
      emailContent = emailContent.replace(
        /{{USER_NAME}}/g,
        userDetails.USER_NAME
      );

      // Send the email
      const mailOptions = {
        from: FROM_EMAIL,
        to: emailIds,
        subject: COMPANY_SUBJECT,
        html: emailContent, // Use the updated HTML content
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send("Error sending email: " + error);
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
              <td>${user.COM_COA_SEG1}</td>
              <td>${user.COM_UNIT_CODE_SEG4}</td>
              <td>${user.COM_DESC}</td>
              <td>${user.EGL_ENT_SEG1}</td>
              <td>${user.EGL_ENT_NAME}</td>
              <td>${user.IS_ENABLED}</td>
              <td>${user.STAGE}</td>
              <td>${user.CREATED_BY}</td>
              <td>${user.APPROVED_BY}</td>
              <td>${user.ACTION_COMMENTS}</td>
              <td>${user.CREATE_DATE}</td>
              <td>${user.MODIFY_DATE}</td> 
              <td>${user.SHORTNAME}</td> 
            </tr>`
    )
    .join("");
};

const generateEmailHtml = (users, USER_NAME) => {
  const templatePath = path.resolve(
    "..",
      "emailTemp",
    "companyCodeApproveTemp.html"
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

companyCodeMapRouter.post("/approve", async (req, res) => {
  const { ReqData, USER_NAME } = req.body;
  const fileReq = ReqData;

    // Extract data from the request body
  const exelDownloadData = [];
  try {
    for (const key in ReqData) {
      exelDownloadData.push(ReqData[key]);
      //console.log(ReqData[key].SHORTNAME === null, "SHORTVALUE")
      if(String(ReqData[key].SHORTNAME).toLowerCase() === 'null'){
        delete ReqData[key].SHORTNAME
      }
      if(String(ReqData[key].COM_UNIT_CODE_SEG4).toLowerCase() === 'null'){
        delete ReqData[key].COM_UNIT_CODE_SEG4
      }
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
        .query(insertQuery(ReqData[key], "T_EGL_COMPANY_CODE_MAP_AUD"));
        const getlatestData = await getPool()
        .request()
        .query(
          "SELECT TOP 1 COMPANY_CODE_ID FROM T_EGL_COMPANY_CODE_MAP_AUD ORDER BY COMPANY_CODE_ID DESC"
        );
      const getAlldata = getlatestData.recordsets[0];

      //console.log(newObjWithCustomFormat, "newObjWithCustomFormat");
      const cmpReq = { ...ReqData[key], ...getAlldata[0] };
      delete cmpReq.MAIN_ID;
      cmpReq.WORK_FLOW_STAGE = null
      
        const updateEglCode = await getPool()
        .request()
        .query(updateQuery(cmpReq, "T_EGL_COMPANY_CODE_MAP","ID", ReqData[key].MAIN_ID ));
     
      const addUserDetailsInT = await getPool()
        .request()
        .query(
          `DELETE FROM T_EGL_COMPANY_CODE_MAP_INT WHERE MAIN_ID = '${ReqData[key].MAIN_ID}'`
        );


      }else {
        if (ReqData[key].STAGE === "APPROVED") {
          delete ReqData[key].MAIN_ID
        const addUserDetailsAud = await getPool()
          .request()
          .query(insertQuery(ReqData[key], "T_EGL_COMPANY_CODE_MAP_AUD"));

        const getlatestData = await getPool()
          .request()
          .query(
            "SELECT TOP 1 COMPANY_CODE_ID FROM T_EGL_COMPANY_CODE_MAP_AUD ORDER BY COMPANY_CODE_ID DESC"
          );
        const getAlldata = getlatestData.recordsets[0];
        const cmpReq = { ...ReqData[key], ...getAlldata[0] };
        const addUserDetails = await getPool()
          .request()
          .query(insertQuery(cmpReq, "T_EGL_COMPANY_CODE_MAP"));
          const addUserDetailsInT = await getPool()
            .request()
            .query(
              `DELETE FROM T_EGL_COMPANY_CODE_MAP_INT WHERE COM_COA_SEG1 = '${ReqData[key].COM_COA_SEG1}'`
            );
        }else {
          delete ReqData[key].MAIN_ID
        const addUserDetailsAud = await getPool()
          .request()
          .query(insertQuery(ReqData[key], "T_EGL_COMPANY_CODE_MAP_AUD"));
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
      subject: COMPANY_SUBJECT,
      html: emailTemplate, // Use the updated HTML content
      attachments: [
        {
          filename: "companyCodeApproved.xlsx",
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

companyCodeMapRouter.get("/getAud", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query(
        "SELECT * FROM T_EGL_COMPANY_CODE_MAP_AUD ORDER BY COMPANY_CODE_ID DESC"
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

companyCodeMapRouter.get("/getAllData", async (req, res) => {
  try {
    const result = await getPool()
      .request()
      .query(
        "SELECT * FROM T_EGL_COMPANY_CODE_MAP"
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = companyCodeMapRouter;
