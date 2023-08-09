const express = require('express')
const router = express.Router()   
const axios = require('axios')
const fs = require('fs')
const cheerio = require('cheerio');
const puppeteer = require('puppeteer')
const path = require('path');
const url = require('url');
const request = require('request');
const session = require('express-session');
const ExcelJS = require('exceljs');

const CourseList = require('./../api/courseList.json')


axios.defaults.baseURL = 'http://localhost:4000/';


function findAndSplitNumbers(inputText) {
    const pattern = /\b\d{3}-\d{3}\b/g;
    let matchedNumbers  =  inputText.match(pattern);
    return matchedNumbers ? matchedNumbers[0] : [];
  }
  

async function getAllCourse() {
    
  return new Promise(async resolve => {
       console.log('setting up...')
        const browser = await puppeteer.launch({})
      
        const page = await browser.newPage()
        const url = 'https://lms2.psu.ac.th/login/index.php/'
        await page.setDefaultNavigationTimeout(0);

        await page.goto(url)
        console.log(`✅ Go to ${url} `)

        let username  =  await page.$(`#username`); 
        let password  =  await page.$(`#password`); 

        let btnLogin = await page.$("#loginbtn")

        let loginToken = await page.$('#login > input[type=hidden]:nth-child(3)')
        loginToken = await loginToken.evaluate(item => item.value)

        await username.click() 
        await page.keyboard.type('6610210505');

        await password.click() 
        await page.keyboard.type('captzswk1.');

        await btnLogin.click()

        console.log(`✅ Checking user `)
       

        
     /*    const path = 'screenshot.jpg';
        const screenshot = await page.screenshot({
          path: path,
          fullPage: true 
        }); */

        await page.waitForNavigation()

        let getCourseData = await page.$$("#frontpage-course-list > div > div > div.info > h3 > a")
        console.log(`📚 Total Course : ${getCourseData.length}`)

        let COURSES_DATA = {}
        let courseList = []

        for(let t of getCourseData) {
          
          let courseData = {
            id : '',
            courseID : '',
            courseName : '',
            link : '',
          }
          
          courseData.id = await t.evaluate(item => item.href.split('id=')[1]);
          courseData.courseName = await t.evaluate(item => item.textContent);
          courseData.link = await t.evaluate(item => item.href);
          courseData.courseID = findAndSplitNumbers(courseData.courseName)

          
          

          courseList.push(courseData)
        }


         //After Login
         const cookies = await page.cookies();
        
         await page.setCookie(...cookies);
 
       const cookieValue = cookies.find(item => item.name === 'MoodleSession').value
       if(cookieValue) console.log(`✅ Logged in `)
       console.log("🍪 cookie: "+cookieValue);
       console.log("🔑 Token :"+loginToken)


        COURSES_DATA.session = cookieValue
        COURSES_DATA.courseList = courseList
        COURSES_DATA.token  = loginToken



        resolve(COURSES_DATA)
      

        browser.close()


          
    
        
        console.log("✅ Finish")

    })

}


router.get("/", async(req, res)=>{
    let data = await getAllCourse()
    console.log(data)

  /*   let data = CourseList */
    let sess  = req.session

    sess.user = {'lms_session' : data.session}
    console.log(sess)

    console.log('----------------------------------')
    res.render('course',{data : data,dataJson : JSON.stringify(data)})


})


router.get('/detail/:id',async (req,res)=>{

  if (req.session.user) {
    const course_id = req.params.id;
    console.log("Getting...");
    console.log(req.session.user.lms_session);

    await axios
      .get(`https://lms2.psu.ac.th/course/view.php?id=${course_id}`, {
        headers: {
          Accept: "text/html",
          Cookie: `MoodleSession=${req.session.user.lms_session}`,
          Connection: "keep-alive",
        },
      })
      .then((response) => {
        res.send(response.data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    console.log("Show course : " + course_id);
  } else {
    console.log("redirecting 🔄")
    res.redirect("/Course");
  }
})



router.get('/json', async (req,res)=>{ 
    let data = CourseList
    let sess  = req.session
    res.json({data})
})


router.get('/generate-excel', async (req, res) => {
    // Get the data to be converted to Excel
   /*  const data = req.body; */
    let scheduleData = await axios.get("/schedule/json")

    // Create a new workbook and set up the sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Schedule');
  
    // Add headers to the worksheet
    const headers = ['Day', 'Start Time', 'End Time', 'Subject ID', 'Subject Name', 'Credit', 'Section', 'Professors', 'Room'];
    worksheet.addRow(headers);
  
    // Add data rows to the worksheet

    scheduleData.data.schedule.forEach(schedule => {
      const row = [

        schedule.day,
        schedule.startTime,
        schedule.endTime,
        schedule.subjectID,
        schedule.subjectName,
        schedule.credit,
        schedule.section,
        schedule.professor.join(', '), // Join multiple professors with comma separator
        schedule.room
      ];
      worksheet.addRow(row);
    });
  
    // Set the response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=schedule.xlsx');
  
    // Generate the Excel file and send it as the response
    workbook.xlsx.write(res)
      .then(() => {
        res.end();
      })
      .catch(err => {
        console.error('Error generating Excel file:', err);
        res.status(500).send('Error generating Excel file');
      });
  });





module.exports = router
