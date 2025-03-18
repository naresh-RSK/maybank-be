const express = require("express");
const userHistoryRouter = express.Router();
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
userHistoryRouter.get('/getAudData', async (req, res) => {
    try {
        const result = await getPool().request().query('SELECT * FROM T_EGL_USER_DETAILS_AUD');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = userHistoryRouter;