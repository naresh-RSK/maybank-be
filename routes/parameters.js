const express = require("express");
const parametersRouter = express.Router();
const { getPool } = require("../Database/db");
const {
   insertQuery
 } = require("../utils/insertQuery");

parametersRouter.post("/delete", async (req, res) => {
  const { requestData, ParameterName } = req.body;
  if(String(requestData.MODIFY_DATE).toLowerCase()=== "null"){
   delete requestData.MODIFY_DATE
  }
  delete requestData.tableData
  console.log(ParameterName, "delete");
  try {
    if (ParameterName === "EGL_AC_CODE") {
      requestData.STAGE = "ROLLBACK";
      if (requestData?.MAIN_ID && String(requestData.MAIN_ID) !== "null") {
        const newRecord = await getPool()
          .request()
          .query(insertQuery(requestData, "T_EGL_AC_CODE_MAP_AUD"));
        const deleteInt = await getPool()
          .request()
          .query(
            `DELETE FROM T_EGL_AC_CODE_MAP_INT WHERE MAIN_ID = ${requestData.MAIN_ID}`
          );
          const updateWorkFlow = await getPool()
        .request()
        .query(
          `UPDATE T_EGL_AC_CODE_MAP SET WORK_FLOW_STAGE = null WHERE ID = ${requestData.MAIN_ID}`
        );
        //const deleteAud = await getPool().request().query(`DELETE FROM T_EGL_AC_CODE_MAP_AUD WHERE GL_AC_CODE = '${requestData.GL_AC_CODE}'`);
      } else {
         delete requestData.MAIN_ID
        const newRecord = await getPool()
          .request()
          .query(insertQuery(requestData, "T_EGL_AC_CODE_MAP_AUD"));
        const deleteInt = await getPool()
          .request()
          .query(
            `DELETE FROM T_EGL_AC_CODE_MAP_INT WHERE GL_AC_CODE = '${requestData.GL_AC_CODE}'`
          );
      }
    } else if (ParameterName === "COMPANY_CODE") {
      if(String(requestData?.COM_UNIT_CODE_SEG4).toLowerCase() === "null"){
         delete requestData.COM_UNIT_CODE_SEG4
      }
      requestData.STAGE = "ROLLBACK";
      if (requestData?.MAIN_ID && String(requestData.MAIN_ID) !== "null") {
         const newRecord = await getPool()
           .request()
           .query(insertQuery(requestData, "T_EGL_COMPANY_CODE_MAP_AUD"));
         const deleteInt = await getPool()
           .request()
           .query(
             `DELETE FROM T_EGL_COMPANY_CODE_MAP_INT WHERE MAIN_ID = ${requestData.MAIN_ID}`
           );
           const updateWorkFlow = await getPool()
         .request()
         .query(
           `UPDATE T_EGL_COMPANY_CODE_MAP SET WORK_FLOW_STAGE = null WHERE ID = ${requestData.MAIN_ID}`
         );
         //const deleteAud = await getPool().request().query(`DELETE FROM T_EGL_AC_CODE_MAP_AUD WHERE GL_AC_CODE = '${requestData.GL_AC_CODE}'`);
       } else {
          delete requestData.MAIN_ID
          if(String(requestData.SHORTNAME).toLowerCase() === "null"){
            delete requestData.SHORTNAME
          }
         const newRecord = await getPool()
           .request()
           .query(insertQuery(requestData, "T_EGL_COMPANY_CODE_MAP_AUD"));
         const deleteInt = await getPool()
           .request()
           .query(
             `DELETE FROM T_EGL_COMPANY_CODE_MAP_INT WHERE COM_COA_SEG1 = '${requestData.COM_COA_SEG1}'`
           );
       }

    } else {
      requestData.STAGE = "ROLLBACK";
      if (requestData?.MAIN_ID && String(requestData.MAIN_ID) !== "null") {
         const newRecord = await getPool()
           .request()
           .query(insertQuery(requestData, "T_EGL_UNIT_CODE_MAP_AUD"));
         const deleteInt = await getPool()
           .request()
           .query(
             `DELETE FROM T_EGL_UNIT_CODE_MAP_INT WHERE MAIN_ID = ${requestData.MAIN_ID}`
           );
           const updateWorkFlow = await getPool()
         .request()
         .query(
           `UPDATE T_EGL_UNIT_CODE_MAP SET WORK_FLOW_STAGE = null WHERE ID = ${requestData.MAIN_ID}`
         );
         //const deleteAud = await getPool().request().query(`DELETE FROM T_EGL_AC_CODE_MAP_AUD WHERE GL_AC_CODE = '${requestData.GL_AC_CODE}'`);
       } else {
          delete requestData.MAIN_ID
         const newRecord = await getPool()
           .request()
           .query(insertQuery(requestData, "T_EGL_UNIT_CODE_MAP_AUD"));
         const deleteInt = await getPool()
           .request()
           .query(
             `DELETE FROM T_EGL_UNIT_CODE_MAP_INT WHERE COM_UNIT_CODE_SEG4 = '${requestData.COM_UNIT_CODE_SEG4}'`
           );
       }
    }
    res.status(200).send({ message: "deleted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = parametersRouter;
