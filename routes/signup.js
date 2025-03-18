const express = require("express")
const signupRouter = express.Router();
const Signup = require('../models/signup');
const Pepole = require('../models/pepoles')

signupRouter.post('/post',async(req,res)=>{
    res.setHeader('Content-Type', 'application/json');
    const signdata = await Signup.find();
      const data = signdata;
     // console.log(signdata)
      const findData = data?.length >0 && data.find(item => item.email == req.body.email && item.mobile == req.body.mobile)
    const signup = new Signup({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        mobile: req.body.mobile
     })
     const pepoles = new Pepole({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        mobile: req.body.mobile,
        street: req.body.street,
        street1:req.body.street1,
        city:req.body.city,
        state:req.body.state,
        district:req.body.district,
        zipcode:req.body.zipcode,
        role: 'default'
     })
    try{
        console.log(findData,"findData")
        if(findData){
         res.json({message:"data already existed"})
        }else{
            const singupData = await signup.save()
            await pepoles.save()
            res.status(200).json({meassage:"successfuly saved",data:singupData})
        }
     
    }catch(err){
     res.status(400).send(err)
    }
})

module.exports = signupRouter;