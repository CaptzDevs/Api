const express = require('express')
const router = express.Router()   
const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio');
const puppeteer = require('puppeteer')
const path = require('path');
const url = require('url');
const request = require('request');


router.get("/",async (req,res)=>{

    const avalibleApi = ['Billboard Top 100','Crypto Price','Schedule',"Course","Stardew"]
    const view = ['/api/BillboardTop100','/api/coin','/Schedule/schedule','/Course','/Stardew']
    const endpoint  = ['/api/billboardTop100/json','/api/coin/json','/Schedule/json','/Course/json']

    let apiData = []
    for (let i = 0 ; i < avalibleApi.length; i++){
        apiData.push({
            name:  avalibleApi[i],
            view : view[i],
            endpoint:  endpoint[i],
        })
    }

    res.render('index',{data:apiData})

  })



  router.get("/twitter",async (req,res)=>{

    let twiterData = await axios.get('/api/twitter').then(res=>{
        return res.data
    })
    console.log(twiterData)
      res.render('twitter',{data:twiterData})

  })




module.exports = router
