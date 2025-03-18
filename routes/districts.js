const { json } = require('express');
const express = require('express')
const districtsRouter =express.Router();
const District = require('../models/districts')

districtsRouter.get('/get',async(req,res)=>{
try {
   const district = await District.find();
   //const districtData =json(district)
   res.status(200).json(district);
   //res.status(200).send(res.json(district))

}catch(err){
    res.status(400).send(err)
}
})

module.exports =districtsRouter