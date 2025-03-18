const express = require("express");
const stateRouter = express.Router();
const State = require('../models/states')

stateRouter.get('/get',async(request,response)=>{

    try{
        const states = await State.find();
        response.status(200).json(states)
    }catch(err){
     response.status(400).send(err)
    }

})

module.exports = stateRouter;