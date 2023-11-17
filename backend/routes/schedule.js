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

const CourseList = require('./../api/courseList.json');

axios.defaults.baseURL = 'http://localhost:4000/';

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

 const UserScheduleConfig = {
    username : '6610210505',
    password : 'captzswk1.',
    year : 2566,
    semester : 1,
 }

 const WebConfig = {
    port : 27,
 }

 //* init year refer to  first 2 charactor from username
 UserScheduleConfig.year = +'25'+UserScheduleConfig.username.slice(0,2)


async function getSchedule(option = {semester : UserScheduleConfig.semester, year: UserScheduleConfig.year}) {
    
    UserScheduleConfig.semester = option.semester || UserScheduleConfig.semester
    UserScheduleConfig.year = option.year || UserScheduleConfig.year
    
    return new Promise(async resolve => {
        console.log("setting up...");
        const browser = await puppeteer.launch({});

        const page = await browser.newPage();
        const url = "https://sso.psu.ac.th/adfs/ls/?wa=wsignin1.0&wtrealm=https%3a%2f%2fsis-hatyai1.psu.ac.th%2f&wctx=rm%3d0%26id%3dpassive%26ru%3d%252fLogin.aspx&wct=2023-07-04T18%3a50%3a38Z&wreply=https%3a%2f%2fsis-hatyai1.psu.ac.th%2f";
        await page.setDefaultNavigationTimeout(0);

        await page.goto(url);
        console.log(`✅ Go to ${url} `);

        let username = await page.$(`#userNameArea input`);
        let password = await page.$(`#passwordArea input`);

        let btnLogin = await page.$("#submitButton");

        /* let loginToken = await page.$('#login > input[type=hidden]:nth-child(3)')
         loginToken = await loginToken.evaluate(item => item.value) */

        await username.click();
        await page.keyboard.type(UserScheduleConfig.username);

        await password.click();
        await page.keyboard.type(UserScheduleConfig.password);

        await btnLogin.click();
        
        console.log(`✅ Checking user `);

        await page.waitForNavigation();

        //After Login
        const cookies = await page.cookies();

        await page.setCookie(...cookies);

        const cookieValue = cookies;
        if (cookieValue) console.log(`🔓 Logged in `);

        console.log("👾 OK , I'm in")
        /* console.log("🍪 cookie: " + JSON.stringify(cookieValue)); */
        /* console.log("🔑 Token :"+loginToken) */

     /*    const path = "screenshot.jpg";
        const screenshot = await page.screenshot({
           path: path,
           fullPage: true,
         }); */

        await page.goto(`https://sis-hatyai${WebConfig.port}.psu.ac.th/Student/StudentClassDate.aspx`);
    
     
        console.log(`📑 get Schedule : ${UserScheduleConfig.semester}/${UserScheduleConfig.year}`)

        let optionValue = await page.$$eval('#ctl00_ctl00_mainContent_PageContent_UcTermYearSelector1_ddlTermYear option', (options, value) => {
            return options.some(option => option.value === value);
          }, `${UserScheduleConfig.semester}/${UserScheduleConfig.year}`);
   
        if(optionValue){


            
        await page.select('#ctl00_ctl00_mainContent_PageContent_UcTermYearSelector1_ddlTermYear', `${UserScheduleConfig.semester}/${UserScheduleConfig.year}`)
            
        let btn_showSchedule = await page.$("#ctl00_ctl00_mainContent_PageContent_btnShow");
        await btn_showSchedule.click();

        await page.waitForSelector("#ctl00_ctl00_mainContent_PageContent_lbStudentFullName");


        browser.close();

        console.log("✅ Get Data Finish");
        
        resolve(await page.content());
    }else{
        console.log(`❌ No Subject Registered On ${UserScheduleConfig.semester}/${UserScheduleConfig.year}`)
        
        resolve({error:'No Subject Registered'});
    }
      })
  
  }



router.post('/data', async (req,res)=>{ 

    
    let query_semester = req.body.semester
    let query_year = req.body.year

    UserScheduleConfig.semester = req.body.semester || UserScheduleConfig.semester
    UserScheduleConfig.year = req.body.year || UserScheduleConfig.year

    if(req.body.key == '555'){
        let tableFile = ''
        const filename = `cache_${UserScheduleConfig.username}_${UserScheduleConfig.semester}_${UserScheduleConfig.year}_schedule.json`
        const filepath = path.join(process.env.project_path,'/cache',filename)

        if (!fs.existsSync(filepath)) {
            console.log("🌐 Fetch Data SIS")
            tableFile = await getSchedule( {
                semester:query_semester,
                year:query_year
            });

            res.send({type: 'html',data: tableFile})
       

        }else{  
            console.log("💾 Fetch Data from Cache")

            try{
                const data = fs.readFileSync(filepath, 'utf8');
                res.send({type: 'json',data: data})

            } catch (err) {
                console.error(err);

            }

        }
      
    }else{
        res.send('Invalid Key');
    }
  
})

router.get("/schedule" , async (req,res)=>{
    let query_semester = req.query.semester
    let query_year = req.query.year

    let scheduleData = await axios.get("/schedule/json",
    {params:
        {
            semester:query_semester,
            year:query_year
        }
    })
    
    if(!scheduleData.data.error){
        res.render("schedule",{data:scheduleData.data})
    }else{
        res.send(scheduleData.data.error)
    }
})

router.get('/json', async (req,res)=>{ 
    
    console.log("📡 Fetching Data...")

    let query_semester = req.query.semester
    let query_year = req.query.year

    UserScheduleConfig.semester = query_semester || UserScheduleConfig.semester
    UserScheduleConfig.year = query_year || UserScheduleConfig.year

    axios.post('/schedule/data',{key:555,semester:query_semester,year:query_year}).then(response=>{

        if(response.data.data.error){
                console.log("------------------------------")
                console.log(`❌ ${response.data.data.error}`);
                console.log("❌ Can't Rendered Schedule")
                console.log("✨ Try another semester or year")
                res.json({"error":'No Subject Registered'})
        }
        else if(response.data.type == 'json'){

            let parsedData = JSON.parse(response.data.data)
            if(parsedData.subjectSet.length > 0){

                res.json(JSON.parse(response.data.data))
                
                console.log("✅ Rendered Schedule")
                console.log('------------Rendered Schedule--------------')

            }else{

                console.log("------------------------------")
                console.log("❌ No Subject Registered");
                console.log("❌ Can't Rendered Schedule")
                console.log("✨ Try another semester or year")

                console.log('-----------END--------------')

                res.json({"error":'No Subject Registered'})
            }

        }else{
            

        let html = response.data.data
        let $ = cheerio.load(html);

        let table = $("table#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1").text()
        // not count header
        let rows =  $("#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr")
       
        let [stdID,name] = $("#ctl00_ctl00_mainContent_PageContent_lbStudentFullName").text().split(" : ")

        let semester = $("#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_lblTerm").text()
        let year =  $("#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_lblYear").text()

        let subjectSet = []
        name = name.replace("  "," ")
        
        let Data = {
            profile: {
                name : `${name}`,
                studentID : stdID,
                semester : semester,
                year : year,

            },
            schedule : []
        }
        let rowData = []


        for (let i = 2 ; i <= rows.length ; i++){
            let day = $(`#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr:nth-child(${i}) > td:nth-child(1)`).text()
            let startTime = $(`#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr:nth-child(${i}) > td:nth-child(2)`).text()
            let endTime = $(`#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr:nth-child(${i}) > td:nth-child(3)`).text()
            let subjectID = $(`#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr:nth-child(${i}) > td:nth-child(4)`).text()
            let subjectName = $(`#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr:nth-child(${i}) > td:nth-child(5)`).text()
            let credit = $(`#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr:nth-child(${i}) > td:nth-child(6)`).text()
            let section = $(`#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr:nth-child(${i}) > td:nth-child(7)`).text()
            let professor = $(`#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr:nth-child(${i}) > td:nth-child(8)`).text()
            let room = $(`#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr:nth-child(${i}) > td:nth-child(9)`).text()

            let d_th_full = ["จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์","อาทิตย์"]

            professor = professor.split(', ') 

            subjectSet.includes(subjectName) ? '' : subjectSet.push(  subjectName ) 

            rowData.push({
                "dayNumber" : d_th_full.indexOf(day),
                'day' : day,
                'startTime' : startTime,
                'endTime' : endTime,
                'subjectID' : subjectID,
                'subjectName' : subjectName,
                'credit' : credit,
                'section' : section,
                'professor' : professor,
                'room' : room,
            })
        }
        Data.schedule = rowData
        Data.subjectSet = subjectSet



        if(subjectSet.length > 0){

            res.json(Data)
            console.log("✅ Rendered Schedule")
            console.log('------------Rendered Schedule--------------')

               //save cache 💾
        const filename = `cache_${UserScheduleConfig.username}_${UserScheduleConfig.semester}_${UserScheduleConfig.year}_schedule.json`
        const filepath = path.join(process.env.project_path,'/cache',filename)
        fs.writeFile(filepath, JSON.stringify(Data), (err) => {
            if (err) {
              console.error('Error creating the file:', err);
            } else {
              console.log('File created and data written successfully.');
            }
          });

        }else{
            console.log("❌ No Subject Registered");
            console.log("❌ Can't Rendered Schedule")
            console.log('-----------END--------------')

            res.json({"error":'No Subject Registered'})

        }

        

     

        }
    })

  
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
