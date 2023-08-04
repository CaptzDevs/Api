const express = require("express");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const path = require("path");
const url = require("url");
const youtubedl = require("youtube-dl-exec");
const ytdl = require("ytdl-core");
const request = require("request");
const session = require("express-session");

axios.defaults.baseURL = "http://localhost:4000/";

function checkAuth(req, res, next) {
  console.log("Check Auth ✅");
  next();
}
async function getCropData(name){
    let url = 'https://stardewvalleywiki.com/'+name;
    return axios.get(url).then(response =>{
         const html = response.data;
         let $ = cheerio.load(html);
        
         let phaseSet = []
         let name = $("#infoboxheader").text()
         let season = $('#infoboxtable > tbody > tr:nth-child(7) #infoboxdetail > span a').map((i, item) => $(item).text()).toArray();
         let detail = $("#infoboxtable > tbody > tr:nth-child(3)").text().trim()
         let plantNumber = 0

         let phaseLength = $("#mw-content-text > div > table:nth-child(6) > tbody > tr:nth-child(2) > td > div > div > img").length
         
         let phaseTableIndex = 6;

         if(phaseLength == 0){
             phaseTableIndex = 7;
         }

        $(`#mw-content-text > div > table:nth-child(${phaseTableIndex}) > tbody > tr:nth-child(2) > td > div > div > img`).map(
            (i, item) => {
                phaseSet.push(
                    {
                        stage: i+1,
                        name: 'https://stardewcommunitywiki.com'+item.attribs['src'],
                        
                    }
                )
                }
            )
   

         $(`#mw-content-text > div > table:nth-child(${phaseTableIndex}) > tbody > tr:nth-child(3) > td`).map((i,item)=>{
            if(i != phaseLength-1){
                phaseSet[i].plantDays = +$(item).text().match(/\d+/g).map(Number);
                plantNumber += phaseSet[i].plantDays
            }else{
                phaseSet[i].harvest = true
            }
         })
         let image = 'https://stardewcommunitywiki.com'+$("#infoboxtable > tbody > tr:nth-child(2) > td > a > img").attr('src')
         let rank = $("#infoboxtable > tbody > tr:nth-child(10) > td > table > tbody > tr:nth-child(3) > td:nth-child(1) > table > tbody > tr > td:nth-child(1) > div  > .foreimage img").map((i, item) => 'https://stardewcommunitywiki.com'+item.attribs['src']).toArray();
         let miniIcon = 'https://stardewcommunitywiki.com'+$("#infoboxtable > tbody > tr:nth-child(10) > td > table > tbody > tr:nth-child(3) > td:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(1) > div > div.backimage > img").attr('src')
         let basePrice = $("#infoboxtable > tbody > tr:nth-child(10) > td > table > tbody > tr:nth-child(3) > td:nth-child(1) > table > tbody > tr > td:nth-child(2)").map((i, item) => +$(item).text().replace('g\n\t','')).toArray();
         let tillerPrice = $("#infoboxtable > tbody > tr:nth-child(10) > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td:nth-child(2)").map((i, item) => +$(item).text().replace('g\n\t','')).toArray();


         let cropData = {
            "image" : image,
            "name" : name,
            "season" : season,
            "seedPrice" : 0,
            "icon" : miniIcon,
            "rank" : rank,
            "sellPrice" : {
                base : basePrice,
                tiller : tillerPrice
            },
            "detail" : detail,
            "totalDays" : plantNumber,
            "phase" : phaseSet,
        }

        return cropData;
       
     });
}


async function getAllCropData(){
    let url = 'https://stardewvalleywiki.com/Crops';
    return axios.get(url).then(response =>{
         const html = response.data;
         let $ = cheerio.load(html);
        
         let name = $("#mw-content-text > div > h3").map((i, item) => {if(i >= 10) return $(item).text().trim()}).toArray();

         let detail = $("#mw-content-text > div > p > i").map((i, item) => {if(i >= 7) return $(item).text().trim()}).toArray();
         
         let image = $("h3 > span > a.image > img").map((i, item) => {if(i >= 0) return  'https://stardewcommunitywiki.com'+item.attribs['src']}).toArray();
         let imageSeed = $("#mw-content-text > div > table > tbody > tr:nth-child(2) > td:nth-child(1) > div.center > div > a > img").map((i, item) =>  'https://stardewcommunitywiki.com'+item.attribs['src'] ).toArray();

         name.pop()

         let cropSet = []

         let j = 0;
         name.forEach(async(item ,i)=>{


                let cropData = {}
                cropData['name'] = name[i]
                cropData['image'] = image[i]
                cropData['detail'] = detail[i]
                
            if(item != 'Mixed Seeds'){
                cropData['seeds'] = imageSeed[j]
                j++
            }else{
                cropData['seeds'] = image[j]
            }
            cropSet.push(cropData)
         })
        return cropSet;
       
     });
}


router.all("/*", (req, res, next) => checkAuth(req, res, next));

router.get("/",async (req, res) => {
    getAllCropData()

    res.render("./stardew/index")
});

router.get("/crops",async (req, res) => {
    console.log("Fetching...")

    let cropDataAll = await getAllCropData()  
    res.json(cropDataAll)
});

router.get("/crop/:name", async(req, res) => {
   let cropData =  await  getCropData(req.params.name);
  res.json(cropData)

});




module.exports = router;
