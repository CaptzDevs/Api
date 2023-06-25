const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser');
const session  = require('express-session');
const cookieParser = require("cookie-parser");
const path = require('path')
const app = express()

let apiRoute = require('../backend/routes/api');
let viewRoute = require('../backend/routes/view');
let testRoute = require('../backend/routes/test');

let scheduleRoute = require('../backend/routes/schedule');




app.set ("view engine", "ejs" );
app.set('views', path.join(__dirname, '/views'));

app.set('trust proxy', 1) // trust first proxy

app.use(cookieParser());

app.use(session({
  name: "user",
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: false,
  cookie: { secure: false ,maxAge: 600000}
}))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors({origin : ["http://localhost:3000",'http://192.168.137.1:3000']}));

app.use('/',viewRoute)
app.use('/test',testRoute)
app.use('/api',apiRoute)
app.use('/view',viewRoute)
app.use('/schedule',scheduleRoute)



const port = process.env.PORT || 4000;
const server = app.listen(port , ()=>{
    console.log('start at http://localhost:'+ port)

})




