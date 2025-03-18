const express = require("express");
const eglSummaryRouter = express.Router();
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
eglSummaryRouter.get('/get', async (req, res) => {
    try {
        const result = await getPool().request().query('SELECT * FROM T_EGL_SUMMARY_REPORT');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

eglSummaryRouter.get('/get/:appCode', async (req, res) => {
    try {
        const systemId = req.params.appCode
        console.log(systemId, "systemId")
        const result = await getPool().request().query(`SELECT * FROM T_EGL_SUMMARY_REPORT WHERE SYSTEM_ID = '${systemId}'`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
module.exports = eglSummaryRouter;