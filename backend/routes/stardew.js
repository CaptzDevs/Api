const express = require("express");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const path = require("path");
const url = require("url");
const request = require("request");
const session = require("express-session");

axios.defaults.baseURL = 'http://localhost:4000/';


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
         if(season.length == 0){
            season = $('#infoboxtable > tbody > tr:nth-child(8) #infoboxdetail > span a').map((i, item) => $(item).text()).toArray();
         }

         let detail = $("#infoboxtable > tbody > tr:nth-child(3)").text().trim()
         let plantNumber = 0
         let phaseTableIndex = 0;
         let phaseLength = 0;

         for (let j = 5 ; j <= 9 ; j++){
         
            phaseLength = $(`#mw-content-text > div > table:nth-child(${j}) > tbody > tr:nth-child(2) > td > div > div > img`).length
            
             if(phaseLength > 0){
                    phaseTableIndex = j;
            }
        }

        console.log(phaseTableIndex)

        //get plant phase 
        $(`#mw-content-text > div > table:nth-child(${phaseTableIndex}) > tbody > tr:nth-child(2) > td > div > div > img`).map(
            (i, item) => {
                phaseSet.push(
                    {
                        stage: i+1,
                        image: 'https://stardewcommunitywiki.com'+item.attribs['src'],
                        
                    }
                )
                }
            )
            

        //get plant phase data
         $(`#mw-content-text > div > table:nth-child(${phaseTableIndex}) > tbody > tr:nth-child(3) > td`).map((i,item)=>{
            if(i != phaseLength-1){
                phaseSet[i].plantDays = +$(item).text().match(/\d+/g).map(Number);
                plantNumber += phaseSet[i].plantDays
            }else{
                phaseSet[i].harvest = true
            }
         })

         let image = $("#infoboxtable > tbody > tr:nth-child(2) > td > a > img").attr('src')
         let basePrice = $("#infoboxtable > tbody > tr:nth-child(10) > td > table > tbody > tr:nth-child(3) > td:nth-child(1) > table > tbody > tr > td:nth-child(2)").map((i, item) => +$(item).text().replace('g\n\t','')).toArray();
         if(basePrice.length == 0){
            basePrice = $("#infoboxdetail > table > tbody > tr > td:nth-child(2)").map((i, item) => $(item).text().replace('g\n\t','')).toArray();
         }
         
         let tillerPrice = $("#infoboxtable > tbody > tr:nth-child(10) > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td:nth-child(2)").map((i, item) => +$(item).text().replace('g\n\t','')).toArray();

         //* convert image to mini icon 
        let icon = image.split('/')
     
        icon[6] = icon[5]
        icon[5] = icon[4]
        icon[4] = icon[3]
        icon[3] = 'thumb'
        icon.push('24px-Coffee_Bean.png')

        icon = 'https://stardewcommunitywiki.com'+icon.join('/')
        image =  'https://stardewcommunitywiki.com'+image

         let cropData = {
            "image" : image,
            "name" : name,
            "season" : season,
            "seedPrice" : 0,
            "icon" : icon,
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

router.get("/cropsData",(req,res)=>{
    fs.readFile("./api/crops.json",(err,data)=>{
        if(err) return res.json(err);
        
        res.json(JSON.parse(data))
    })
})

async function getAllCropData(){
    return axios.get('stardew/cropsData').then(res=>{
        return res.data;
    }).catch(err=>{
        console.log(err)
    });
}

async function getAllCropDataWeb(){
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



async function getAllMineral(){
   let url = 'https://stardewvalleywiki.com/Minerals';

    return axios.get(url).then(response =>{

         const html = response.data;
         let $ = cheerio.load(html);
        
         let data = [];
         let tableIndex = 10;
        let type_arr = ['foraged','gems','geode',]
         for (let i = 0 ; i < 3; i++){
        
         
         let name  = $(`#mw-content-text > div > table:nth-child(${tableIndex}) > tbody > tr > td:nth-child(2) > a`)
         .map((i, item) => {
            let data = {
                name : $(item).text(),
            }
            return data
         }
         
         )
         .toArray();

         let image  = $(`#mw-content-text > div > table:nth-child(${tableIndex}) > tbody > tr > td:nth-child(1) > div > div > a > img`)
         .map((i, item) => {
            let data = {
                image : 'https://stardewcommunitywiki.com'+item.attribs['src'],
            }
            
            return data
         }
         
         )
         .toArray();


         let detail = $(` #mw-content-text > div > table:nth-child(${tableIndex}) > tbody > tr > td:nth-child(3)`)
         .map((i, item) => {
            let data = {
                detail : $(item).text().trim(),
            }
            
            return data
         }
         
         )
         .toArray();

         let sellPrice  = $(` #mw-content-text > div > table:nth-child(${tableIndex}) > tbody > tr > td:nth-child(4) > span.no-wrap`)
         .map((i, item) => {
            let data = {
                sellPrice : parseInt($(item).text().replace('g','').replace(/,/g, ''), 10),
            }
            
            return data
         }
         
         )
         .toArray();


         let geometric_sellPrice  = $(` #mw-content-text > div > table:nth-child(${tableIndex}) > tbody > tr > td:nth-child(5) > span.no-wrap`)
         .map((i, item) => {
            let data = {
                sellPrice : parseInt($(item).text().replace('g','').replace(/,/g, ''), 10),
            }
            return data
         }
         
         )
         .toArray();

        
         let items = [];
       
         for (let i = 0; i < name.length; i++) {
            let itemData = {
                name: name[i].name,
                image: image[i].image,
                detail: detail[i].detail,
                sellPrice: sellPrice[i].sellPrice,
                geometricSellPrice: geometric_sellPrice[i].sellPrice
            };
        
            items.push(itemData);
        }

        data[type_arr[i]] = items

        tableIndex += 3;
    }

     return data
    })
}

router.all("/*", (req, res, next) => checkAuth(req, res, next));


router.get("/",async (req, res) => {
    let data = {}
    
    const cropData  = await getAllCropData();
    const mineralData = await getAllMineral()
    const springData =  cropData.filter(item => item.data?.season.includes('Spring'));
    data['minerals'] = mineralData
    data['season'] = ['spring',"summer","fall",'winter']
    data['crops']  = cropData
    data['cropSpring']  = springData

    res.render("./stardew/index",data)


});

router.get("/crops",async (req, res) => {
    console.log("Fetching...")

    let cropDataAll = await getAllCropData()  
    res.json(cropDataAll)
});

router.get("/minerals",async (req, res) => {

    console.log("Fetching Minerals...")
    let mineralDataAll = await getAllMineral()
    res.json(mineralDataAll)
});

router.get("/crop/:name", async(req, res) => {
   let cropData =  await  getCropData(req.params.name);
  res.json(cropData)

});






module.exports = router;
