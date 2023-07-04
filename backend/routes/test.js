const express = require('express')
const router = express.Router()   
const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio');
const puppeteer = require('puppeteer')
const path = require('path');
const url = require('url');
const youtubedl = require('youtube-dl-exec')
const ytdl = require('ytdl-core');
const request = require('request');
const session = require('express-session');

axios.defaults.baseURL = 'http://localhost:4000/';

async function generateAndDownloadPDF(url) {
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle0' });
  const path = 'example.pdf';

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    path : path,
    displayHeaderFooter : true,
    margin : '5px', 
    footerTemplate: `
    <span class="pageNumber"></span>/<span class="totalPages"></span>
`,
  });

  await browser.close();
  return path

}

async function takeScreenshot(url) {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

 /*  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  }); */
  
  

      await page.goto(url, { waitUntil: 'networkidle0' });
      const path = 'screenshot.jpg';
    
      const screenshot = await page.screenshot({
        path: path,
        fullPage: true 
      });
    
      await browser.close();
      return path
}

router.get('/coin2', async (req,res,e)=>{ 
 
  let limit = req.query.limit || 100
  
  let url = 'https://www.binance.com/en/markets/overview';

  
   axios.get(url).then(response =>{
        const html = response.data;
        let $ = cheerio.load(html);

        let img = $('.css-k5eban img').map((i,item)=> item.attribs['src'] ).toArray()
        let shortName = $('.css-1x8dg53').append(',').text().split(',')
        let fullName = $('.css-1ap5wc6').append(',').text().split(',')
        let price = $('.css-leyy1t > .css-ydcgk2 > div ').append('|').text().split('|')

        let coinData = []

        for (let i = 0 ; i < 15; i++){
            coinData.push( {
              rank: i+1,
              img: img[i],
              shortName: shortName[i],
              fullName: fullName[i],
              price: price[i],
            })
          }
          if (!res.headersSent) {
            res.send(coinData)
          }
      
    });

})


router.get("/testLoginIG", async (req,res)=>{
  const browser = await puppeteer.launch({})
  const page = await browser.newPage()
  await page.setDefaultNavigationTimeout(0);

  let url = 'https://www.instagram.com/'

  await page.goto(url, { waitUntil: 'networkidle0' });
  let selectorUsername = '#loginForm > div > div:nth-child(1) > div > label > input'
  let selectorPassword = '#loginForm > div > div:nth-child(2) > div > label > input'
  let selectorshowPassword = '#loginForm > div > div:nth-child(2) > div > div > div > button'
  let selectorLoginBtn = '#loginForm > div > div:nth-child(3) > button'

  let linkProfile = "div.x6s0dn4.x9f619.xxk0z11.x6ikm8r.xeq5yr9.x1s85apg.x1swvt13.xzzcqpx > div > div"


  await page.waitForSelector(selectorUsername)
  await page.focus(selectorUsername); 
  await page.keyboard.type('while_sky');


  await page.waitForSelector(selectorPassword)
  await page.focus(selectorPassword); 
  await page.keyboard.type('onsky075');

  await page.waitForSelector(selectorshowPassword)
  await page.click(selectorshowPassword)


  await page.waitForSelector(selectorLoginBtn)
  await page.click(selectorLoginBtn)

  setTimeout( async() => {
    /* await page.waitForSelector(linkProfile)
    await page.click(linkProfile) */
 
  console.log("✅")
  const path = 'screenshot.jpg';

  /* await page.setViewport({ width: 300, height: 300 }); */
  const screenshot = await page.screenshot({
    path: path,
    fullPage: true 
  });

  }, 10000);
  /* await browser.close(); */


})


router.get('/screenshot',(req,res)=>{
  
  if(req.query.url){

  takeScreenshot(req.query.url).then(pdf => {
    console.log('📸 Take screenshot successfully');
    let filepath =  path.join(path.dirname(__dirname),'screenshot.jpg')
    res.sendFile(filepath);
  })
  .catch(error => {
    console.log(error);
  });

  }else{
    res.send("enter url")
  }
})


router.get('/print',(req,res)=>{
  
  if(req.query.url){
  generateAndDownloadPDF(req.query.url).then(pdf => {
    console.log('PDF generated successfully');
    let filepath =  path.join(path.dirname(__dirname),'example.pdf')
    res.sendFile(filepath);
  })
  .catch(error => {
    console.log(error);
  });

  }else{
    res.send("enter url")
  }
})









/* 
async function youtubeDowloaderAdvanced(url){

  let urlArr = [];
 await youtubedl('https://youtu.be/TNVAMCdDbN8', {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: [
      'referer:youtube.com',
      'user-agent:googlebot'
    ]
  
  }).then(output => {

    console.log(output.title)
    console.log("----------------------MP3---------------------")
    output.formats.forEach((item,i)=>{
      if(item.ext != 'mhtml' && item.audio_channels != null && item.fps == null){

        console.log(item.ext,item.format_note,item.audio_channels,item.format)
        console.log(item.url)
      }

    })

    console.log("----------------------MP4---------------------")
    output.formats.forEach((item,i)=>{
      if(item.ext != 'mhtml' && item.audio_channels != null  && item.fps != null){

        console.log(item.ext,item.format_note,item.format)
     
      }

   
    })
    console.log('------------')

  })

  return urlArr;

}




router.get('/youtube',async (req,res)=>{
  if(req.query.url){

    res.header('Content-Disposition','attachment; filename="video.mp4"')
    ytdl(req.query.url,{
      format : 'mp4',
      quality : 'highest'
    }).pipe(res);
    

    fs.writeFile('log.json',JSON.stringify(await ytdl.getInfo('https://youtu.be/TNVAMCdDbN8')),(err)=>{
      if(!err){
        console.log('INFO ✅')
      }
    }) 

  
    }else{
      res.send("enter url")
    }
  })


router.get('/youtubeAdvance',async (req,res)=>{
  if(req.query.url){
   await youtubeDowloaderAdvanced(req.query.url).then(data => {
      console.log('PDF generated successfully');
      let filepath =  path.join(path.dirname(__dirname),'youtube.mp4')
      res.sendFile(filepath);

      res.header('Content-Disposition','attachment; filename="video.mp4"')

    })
    .catch(error => {
      console.log(error);
    });
  
    }else{
      res.send("enter url")
    }
  })
 */
module.exports = router
