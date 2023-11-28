const express = require('express')
const router = express.Router()   
const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio');
const puppeteer = require('puppeteer')
const path = require('path');
const url = require('url');
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


function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

async function getInstagramInfo(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const screenshot = 'webscreen.jpg';

  try {
    // Navigate to the Instagram page
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for some time to ensure dynamic content is loaded (you may need to adjust this)
    console.log(`Go to ${url}`)
    console.log("Fetching")

    // Extract favicon

   const faviconUrl = await page.waitForSelector('link[rel="icon"], link[rel="shortcut icon"]')
    .then(elem => page.evaluate(el => el.href, elem))
    .then(data => {
      console.log('Favicon URL:', data);
      return data;
    })
    .catch(error => {
      console.error('Error:', error);
      return "";

    });


    const description = await page.waitForSelector('meta[property="og:description"], meta[property="description"]')
    .then(elem => page.evaluate(el => el.content, elem))
    .then(data => {
      console.log('description', data);
      return data;

    })
    .catch(error => {
      console.error('Error:', error);
      return "";

    });


    const title = await page.waitForSelector('meta[property="og:title"], meta[property="title"]')
    .then(elem => page.evaluate(el => el.content, elem))
    .then(data => {
      console.log('title', data);
      return data;

    })
    .catch(error => {
      console.error('Error:', error);
      return "";

    });


    const pageUrl = await page.waitForSelector('meta[property="og:url"], meta[property="url"]')
    .then(elem => page.evaluate(el => el.content, elem))
    .then(data => {
      console.log('url', data);
      return data;

    })
    .catch(error => {
      console.error('Error:', error);
      return "";

    });
    
    

    let profileInfo = {}

    const profileImage = await page.waitForSelector('meta[property="og:image"], meta[property="image"]')
    .then(elem => page.evaluate(el => el.content, elem))
    .then(data => {
      console.log('profileImage', data);
      return data;
    })
    .catch(error => {
      console.error('Error:', error);
      return "";
    });


    await page.screenshot({ path: screenshot })

/*     await delay(15000)
    // Extract profile information
    const profileInfo = await page.evaluate(() => {
      const username = document.querySelector('header section h1').innerText;
      const bio = document.querySelector('header section div span').innerText;
      const profileImage = document.querySelector('header img').src;

      return { username, bio, profileImage };
    }); */

    profileInfo['image'] = profileImage

    return { profileInfo , faviconUrl, description,title ,pageUrl}; 
  } catch (error) {
    console.error('Error:', error);
    return null;
  } finally {
    await browser.close();
  }
}


router.get('/ig', async (req,res)=>{ 
    const instagramUrl = 'https://www.instagram.com/captain.swk/';
  
    try {
      const info = await getInstagramInfo(instagramUrl);
      console.log("---------------------")
      console.log(info);
      console.log("---------------------")
      res.json(info);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  /**
 * @name Instagram
 *
 * @desc Logs into Instagram with credentials. Provide your username and password as environment variables when running the script, i.e:
 * `INSTAGRAM_USER=myuser INSTAGRAM_PWD=mypassword node instagram.js`
 *
 */
router.get("/igLogin",async (req,res)=>{
  const screenshot = 'instagram.png';
(async () => {
  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()
  await page.goto('https://www.instagram.com/accounts/login/?source=auth_switcher', {
    waitUntil: 'networkidle2'
  })

  

  // email
  await page.waitForSelector("[name='username']")
  // await page.click("[name='username']");
  await page.type("[name='username']", 'while_sky')

  // password
  await page.keyboard.down('Tab')
  // uncomment the following if you want the passwor dto be visible
  // page.$eval("._2hvTZ.pexuQ.zyHYP[type='password']", (el) => el.setAttribute("type", "text"));
  await page.keyboard.type("onsky075")

  // the selector of the "Login" button
  /*  await page.click("._0mzm-.sqdOP.L3NKy>.Igw0E.IwRSH.eGOV_._4EzTm"); */

  // we find the Login btn using the innerText comparison because the selector used for the btn might be unstable
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(function (btn) {
        if (btn.innerText === 'Log in') { 
            btn.click();
        }
    });
});


  await page.waitForSelector('.glyphsSpriteMobile_nav_type_logo')

  await page.screenshot({ path: screenshot })

  browser.close()
  console.log('See screenshot: ' + screenshot)
})()

})
  


router.get('/twitter', async (req,res)=>{ 
  const browser = await puppeteer.launch({})

  const page = await browser.newPage()

  await page.goto('https://twitter.com/whitemeow1998')

  
  await setTimeout( async() => {
    await autoScroll(page);


  let img  =  await page.$$eval(`img`, elements => elements.map(el => el.src)); 
  
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



router.get('/coin/json', async (req,res)=>{ 
  let query = req.query
  let limit = query.limit || 15
  
  res.send(await scrapeCoin())
})


router.get("/BillboardTop100/",async (req,res)=>{

  

  let SongData = await axios.get('/api/billboardTop100/json').then(res=>{
      return res.data
  })

    res.render('music',{data:SongData})

})

router.get("/coin",async (req,res)=>{

  let coinData = await axios.get('/api/coin/json').then(res=>{
      return res.data
  })

    res.render('coin',{data:coinData})

})


router.get('/billboardTop100/json',(req,res)=>{

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
              item
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
