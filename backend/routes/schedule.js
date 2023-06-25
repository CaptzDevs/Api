const express = require('express')
const router = express.Router()   
const axios = require('axios')
const fs = require('fs')
const cheerio = require('cheerio');
const puppeteer = require('puppeteer')
const path = require('path');
const url = require('url');
const youtubedl = require('youtube-dl-exec')
const ytdl = require('ytdl-core');
const request = require('request');
const session = require('express-session');
const ExcelJS = require('exceljs');


axios.defaults.baseURL = 'http://localhost:4000/';


router.post('/data', async (req,res)=>{ 
    if(req.body.key == '555'){
        const tableFile = path.join(__dirname,'..','/assets/ตารางเรียน.html')
        res.sendFile(tableFile)
    }else{
        res.status(404);
        res.send('Invalid Key')
    }
  
})

router.get("/schedule" , async (req,res)=>{

    let scheduleData = await axios.get("/schedule/json")
    res.render("schedule",{data:scheduleData.data})
})

router.get('/json', async (req,res)=>{ 
    

    axios.post('/schedule/data',{key:555}).then(response=>{
        console.log(response.status )
        
        let html = response.data
        let $ = cheerio.load(html);

        let table = $("table#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1").text()
        // not count header
        let rows =  $("#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_GridView1 > tbody > tr")
       
        let [stdID,name] = $("#ctl00_ctl00_mainContent_PageContent_lbStudentFullName").text().split(" : ")

        let term = $("#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_lblTerm").text()
        let year =  $("#ctl00_ctl00_mainContent_PageContent_UcGridViewClassDate1_lblYear").text()

        let subjectSet = []
        name = name.replace("  "," ")
        
        let Data = {
            profile: {
                name : `${name}`,
                studentID : stdID,
                term : term,
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

      
        console.log('------------Rendered JSON--------------')
        res.json(Data)

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
