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


async function scrapeCoin() {
    const browser = await puppeteer.launch({})
  
    const page = await browser.newPage()

    await page.goto('https://coincap.io/')

    let img  =  await page.$$eval(`table > tbody > tr > td > img`, elements => elements.map(el => el.src)); 
    var shortName =  await page.$$eval(`div.ellipsis > a > p`, elements => elements.map(el => el.textContent)); 
    var fullName =  await page.$$eval(`div.ellipsis > a `, elements => elements.map(el => ''+el.innerText.split('\n\n')[0])); 
    var price = await page.$$eval(`table > tbody > tr > td:nth-child(3) > span`, elements => elements.map(el => el.textContent)); 
    
    browser.close()

    let coinData = []

    for (let i = 0 ; i < 20 ; i++){
      coinData.push({
        rank : i+1,
        img : img[i],
        shortName : shortName[i],
        fullName : fullName[i],
        price : price[i]
      })
    }
  
    return coinData
}

async function scrapeIG() {



}


router.get('/ig', async (req,res)=>{ 
  let query = req.query
  let limit = query.limit || 15

  const browser = await puppeteer.launch({})

  const page = await browser.newPage()

  setTimeout(async () => {
    await page.goto('https://www.instagram.com/p/CpNOmFGhTkY/')

    let img  =  await page.$$eval(`#mount_0_0_NN > div > div > div:nth-child(2) > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div.x1uvtmcs.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv.x1lytzrv.x1t2pt76.x7ja8zs.x1n2onr6.x1qrby5j.x1jfb8zj > div`, elements => elements.map(el => el.src)); 
    
    console.log(img)
    browser.close()

    res.send(img)
  }, 15000);
  
})



router.get('/twitter', async (req,res)=>{ 
  const browser = await puppeteer.launch({})

  const page = await browser.newPage()

  await page.goto('https://twitter.com/whitemeow1998')

  
  await setTimeout( async() => {
    await autoScroll(page);


  let img  =  await page.$$eval(`.r-u8s1d.r-ipm5af.r-13qz1uu > div > img`, elements => elements.map(el => el.src)); 
  
  browser.close()

  
  res.send(img.filter(item=> item.includes('small')))

}, 10000);
})

async function autoScroll(page){
await page.evaluate(async () => {
  await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if(totalHeight >= scrollHeight - window.innerHeight){
              clearInterval(timer);
              resolve();
          }
      }, 100);
  });
});
}



router.get('/coin', async (req,res)=>{ 
  let query = req.query
  let limit = query.limit || 15
  
  res.send(await scrapeCoin())
})



router.get('/billboardTop100',(req,res)=>{

    let limit = req.query.limit || 100
    
    let url = 'https://www.billboard.com/charts/hot-100/';

    axios.get(url).then(response =>{
          const html = response.data;
          let $ = cheerio.load(html);
        
          /* let img = $('.o-chart-results-list-row-container > ul > li img.c-lazy-image__img') */
          let img = $('ul > li img.c-lazy-image__img').map((i,item)=> item.attribs['data-lazy-src'] ).toArray()
          let song = $('.lrv-u-width-100p > ul > li h3#title-of-a-story').text().split('\n\n')
          let artist = $('.lrv-u-width-100p > ul > li h3#title-of-a-story').next().text().split('\n\n');

          let json = {
            song: song,
            artist : artist,
            img : img,
          }; 

        let imgArr  = []
        let songtArr = []
        let artistArr = []

        let songData = []

        json.img.forEach(item=>{

          if(item.length > 0){
            imgArr.push(item);
          }
        })


        json.song.forEach(item=>{

          if(item.length > 0){
            songtArr.push(
            item.replace(/[\!\t\n]/g, '')
            );
          }
        })

          json.artist.forEach(item=>{
            if(item.length > 0){
              artistArr.push(
              itemc
              );
            }
          })

          for (let i = 0 ; i < 100; i++){
            songData.push( {
            rank: i+1,
            img: imgArr[i],
            song: songtArr[i],
            artist: artistArr[i],

          })


            }

          songData.length = limit

          res.send(songData)

        
      });
      
})



router.get('/coinTest',(req,res) =>{
    var config = {
        method: 'GET',
        url: 'https://api.coincap.io/v2/assets/bitcoin',
        headers: {
            'x-api-key': '2699d4c7-b1ad-4e51-92b0-4a963071bab7'
          }
      }; 
    
      axios(config)
      .then((response) => {
        res.json(response.data)
      })
      .catch((error) => {
        console.log(error);

      });
    
})


router.get('/login', (req, res) => {
  let sess = req.session
  sess.user = {username:'Captz123',role:'admin'}

  res.send(`<h1>Login as ${sess.user.username} </h1><a href="http://localhost:4000/api/session">Index</a>`)
  console.log(`Login as ${sess.user.username}`)

})

router.get('/session', (req, res) => {
  let sess = req.session
  console.log(sess)
  if(sess.user){
    res.send(`<h1>HELLO ${sess.user.username} </h1><a href="http://localhost:4000/api/logout">Logout</a>`)

  }else{
    res.send('<h1>No Session</h1><a href="http://localhost:4000/api/login">Login</a>')
  }
})


router.get('/logout', (req, res) => {
  let sess = req.session
  
  res.send(`<h1>Logout</h1><a href="http://localhost:4000/api/session">Index</a>`)

  sess.destroy()
  console.log('Logouted')
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
