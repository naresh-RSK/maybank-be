const express = require("express");
const eglOutboundTrlrRouter = express.Router();
const { getPool } = require('../Database/db')

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
eglOutboundTrlrRouter.get('/get', async (req, res) => {
    try {
        const result = await getPool().request().query('SELECT * FROM T_EGL_HO_OUTBOUND_TRLR');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

eglOutboundTrlrRouter.get('/get/:systemId', async (req, res) => {
    try {
        const systemId = req.params.systemId
        //console.log(systemId, "systemId")
        const result = await getPool().request().query(`SELECT * FROM T_EGL_HO_OUTBOUND_TRLR WHERE APPLN_CODE = '${systemId}'`);
        // const uniqueArray = result.recordset.reduce((acc, current) => {
        //     if (!acc.some((item) => item.EFF_DTE === current.EFF_DTE)) {
        //       acc.push(current);
        //     }
        //     return acc;
        //   }, []);
        // const data = result?.recordset?.length > 0 ? Array.from(
        //     result.recordset.reduce((map, obj) => map.set(obj.name, obj), new Map()).values()
        //   ) : []
        const data = result?.recordset?.length > 0 ? result.recordset: []
          console.log(result, "data")
          if(data?.length > 0){
            res.json(data)
          }else{
            res.json({data:[], message: "data is not found" })
          }
          
        
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// eglRxceptionRouter.get('/get/:systemId/:effDate', async (req, res) => {
//     try {
//         const {systemId, effDate} = req.params
//         console.log(systemId, "systemId")
//         const TableName = (systemId === "HDR" || systemId === "TRLR")? `T_EGL_HO_OUTBOUND_${systemId}`: `T_EGL_HO_OUTBOUND_${systemId}_DTL`
//         const result = await getPool().request().query(`SELECT * FROM ${TableName} WHERE SYSTEM_ID = '${systemId}' AND EFF_DTE='${effDate}'`);
//         // const uniqueData = result?.recordset?.length > 0 && Array.from(
//         //     result.recordset.reduce((map, obj) => map.set(obj.name, obj), new Map()).values()
//         //   );
//         const data =result.recordset
//         //const dataType = {type: "TABLE"}
//         if(data?.length > 0){
//             const dataType = {data: data, type: "TABLE"}
//             res.json(dataType)
//           }else{
//             const dataType = {data: [], type: "TABLE"}
//             res.json(dataType)
//           }
//        // res.json(data,dataType)
        
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });
module.exports = eglOutboundTrlrRouter ;