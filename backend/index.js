const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser');
const session  = require('express-session');
const cookieParser = require("cookie-parser");
const path = require('path');

const app = express()

require('dotenv').config();

app.use(express.static(path.join(__dirname, 'assets')))

let apiRoute = require('../backend/routes/api');
let viewRoute = require('../backend/routes/view');
let testRoute = require('../backend/routes/test');

let scheduleRoute = require('../backend/routes/schedule');
let courseRoute = require('../backend/routes/course');
let Stardew = require('../backend/routes/stardew');

let lmsRoute = require('../backend/routes/lms');

app.set ("view engine", "ejs" );
app.set('views', path.join(__dirname, '/views'));
app.set('trust proxy', 1) // trust first proxy

app.use(cookieParser());


app.use(session({
  name: "user",
  secret: 'captzApi_sess',
  saveUninitialized: true,
  resave: false,
  cookie: { secure: false ,maxAge: 6000000},
}))

/* app.use((req, res, next) => {
  console.log(`${req.method} : ${req.url}`)
  next();
}); */


app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cors());
/* app.use(cors({origin : ["http://localhost:3000",'http://192.168.137.1:3000','http://127.0.0.1:5501']})); */

app.use('/',viewRoute)
app.use('/test',testRoute)
app.use('/api',apiRoute)
app.use('/view',viewRoute)
app.use('/schedule',scheduleRoute)
app.use('/course',courseRoute)
app.use('/lms',lmsRoute)
app.use('/stardew',Stardew)

const port = process.env.PORT || 4000;
const server = app.listen(port , ()=>{
    console.log('start at '+ process.env.base_url)
})

server.on('test',()=>{
  console.log('hi')
})





