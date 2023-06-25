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

    const avalibleApi = ['Billboard Top 100','Crypto Price','Schedule']
    const view = ['/view/BillboardTop100','/view/coin','/Schedule/schedule']
    const endpoint  = ['/api/billboardTop100','/api/coin','/Schedule/json']

    let apiData = []
    for (let i = 0 ; i < avalibleApi.length; i++){
        apiData.push({
            name:  avalibleApi[i],
            view : view[i],
            endpoint:  endpoint[i],
        })
    }

    console.log(apiData)
    res.render('index',{data:apiData})

  })

router.get("/coin",async (req,res)=>{

    let coinData = await axios.get('/api/coin').then(res=>{
        return res.data
    })

      res.render('coin',{data:coinData})

  })

  router.get("/twitter",async (req,res)=>{

    let twiterData = await axios.get('/api/twitter').then(res=>{
        return res.data
    })
      res.render('twitter',{data:twiterData})

  })


router.get("/BillboardTop100",async (req,res)=>{

    let SongData = await axios.get('/api/billboardTop100').then(res=>{
        return res.data
    })

      res.render('music',{data:SongData})

  })



module.exports = router
