const express = require('express')
const router = express.Router()   
const fs = require('fs')
const axios = require('axios')
const session = require('express-session');

axios.defaults.baseURL = 'http://localhost:4000/';


router.get('/', async (req,res)=>{ 
    res.render('./lms/login')
})

router.get('/home', async (req,res)=>{ 
    res.render('./lms/')
})


module.exports = router
