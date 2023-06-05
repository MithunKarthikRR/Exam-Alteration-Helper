import express from 'express'
import mysql from 'mysql2'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

import bodyParser from 'body-parser'
import csv from 'fast-csv'
import fs from 'fs'

const app = express();
app.use(cors(
    {
        origin: ["http://localhost:3000"],
        methods: ["POST", "GET", "PUT"],
        credentials: true
    }
));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "signup"
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../client/public/images')
    },
    filename: (req, file, cb) => {
        const currentDate = new Date();
        const uniqueFilename = `${currentDate.getTime()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
})

const upload = multer({
    storage: storage
})

const storagepdf = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../client/public/pdf')
    },
    filename: (req, file, cb) => {
        const currentDate = new Date();
        const uniqueFilename = `${currentDate.getTime()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
})

const uploadpdf = multer({
    storage: storagepdf
})

con.connect(function(err) {
    if(err) {
        console.log("Error in Connection");
    } else {
        console.log("Connected");
    }
})

app.get('/getEmployee', (req, res) => {
    const sql = "SELECT * FROM employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Get employee error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})

app.get('/get/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM employee where id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Get employee error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})

app.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE employee set address = ? WHERE id = ?";
    con.query(sql, [req.body.address, id], (err, result) => {
        if(err) return res.json({Error: "update employee error in sql"});
        return res.json({Status: "Success"})
    })
})

app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "Delete FROM employee WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "delete employee error in sql"});
        return res.json({Status: "Success"})
    })
})

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        return res.json({Error: "You are not Authenticated"});
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if(err) return res.json({Error: "Token wrong"});
            req.role = decoded.role;
            req.id = decoded.id;
            next();
        } )
    }
}

app.get('/dashboard',verifyUser, (req, res) => {
    return res.json({Status: "Success", role: req.role, id: req.id})
})

app.get('/fdashboard',verifyUser, (req, res) => {
    return res.json({Status: "Success", role: req.role, id: req.id})
})

app.get('/adminCount', (req, res) => {
    const sql = "Select * from users where role = 'admin'";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in runnig query"});
        return res.json(result);
    })
})

app.get('/employeeCount', (req, res) => {
    const sql = "Select count(id) as employee from employee";
    con.query(sql, (err, result) => {
        if(err) return res.json({Error: "Error in runnig query"});
        return res.json(result);
    })
})

app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users Where email = ? AND  password = ?";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if(err) return res.json({Status: "Error", Error: "Error in runnig query"});
        if(result.length > 0) {
            const id = result[0].id;
            const token = jwt.sign({role: "admin"}, "jwt-secret-key", {expiresIn: '1d'});
            res.cookie('token', token);
            return res.json({Status: "Success"})
        } else {
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
})

app.post('/employeelogin', (req, res) => {
    const sql = "SELECT * FROM employee Where email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if(err) return res.json({Status: "Error", Error: "Error in runnig query"});
        if(result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, response)=> {
                if(err) return res.json({Error: "password error"});
                if(response) {
                    const token = jwt.sign({role: "faculty", id: result[0].id}, "jwt-secret-key", {expiresIn: '1d'});
                    res.cookie('token', token);
                    return res.json({Status: "Success", id: result[0].id})
                } else {
                    return res.json({Status: "Error", Error: "Wrong Email or Password"});
                }                
            })
            
        } else {
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({Status: "Success"});
})

app.post('/create', (req, res) => {
    var name = req.body.name
    var mail = req.body.email
    const passwordLength = 10;
    const randomBytes = crypto.randomBytes(passwordLength);
    const password = randomBytes.toString('hex').slice(0, passwordLength);
    console.log(password);
    const sql = "INSERT INTO employee (`name`,`email`,`password`) VALUES (?)";
    bcrypt.hash(password.toString(), 10, (err, hash) => {
        if(err) return res.json({Error: "Error in hashing password"});
        const values = [
            name,
            mail,
            hash
        ]
        console.log(values)
        con.query(sql, [values], (err, result) => {
            // console.log('ewsdfg')
            if(err) return res.json({Error: "Inside singup query"});
            return res.json({Status: "Success"});
        })
    })
})


app.post('/examdetails', uploadpdf.fields([{ name: 'csvFile' }, { name: 'pdfFile' }]), (req, res) => {
    const { csvFile, pdfFile } = req.files;
    uploadCsv( "../client/public/pdf/" + csvFile[0].filename, req)

    const values = [
        req.body.examName,
        req.body.year,
        req.body.department,
        pdfFile[0].filename
    ]

    const sql = "INSERT INTO examschedulepdf (`examname`, `year`, `department`, `filename`) VALUES (?)"
    con.query(sql, [values], (err, result) => {
        if(err) return res.json({Error: "Upload Failure"});
        return res.json({Status: "Success"});
    })
})

function uploadCsv(path,req){
    let stream = fs.createReadStream(path)
    let csvDataColl = []
    let fileStream = csv
    .parse()
    .on('data', function(data){
        data.push(req.body.examName)
        data.push(req.body.year)
        data.push(req.body.department)
        csvDataColl.push(data)
    })
    .on('end', function(){
        csvDataColl.shift()
        let query = "INSERT INTO examdetails (`date`,`slot`,`starttime`,`endtime`,`roomnumber`,`course`,`facultyname`,`facultymail`,`academicyear`,`examname`,`department`) VALUES (?)"        
        for (let i = 0; i < csvDataColl.length; i++) {
            const rowData = csvDataColl[i];          
            con.query(query, [rowData], (error, res) => {

            });
        }
        fs.unlinkSync(path) 
    })
    stream.pipe(fileStream)
}

var email;
app.get('/getExams/:id', (req, res) => {
    const id = req.params.id;
    // Fid -> Femail
    const sql1 = "SELECT * FROM employee WHERE id = ?";
    con.query(sql1,[id], (err, result) => {
        if(err) console.log("Femail fetch error")
        else email = result[0].email
    })
    //Femail -> resp exams
    const sql = "SELECT * FROM examdetails WHERE facultymail = ?";
    con.query(sql,[email], (err, result) => {
        if(err) return res.json({Error: "Get exams error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})
app.get('/getAllExams', (req, res) => {
    //Femail -> resp exams
    const sql = "SELECT * FROM examdetails";
    con.query(sql,(err, result) => {
        if(err) return res.json({Error: "Get exams error in sql"});
        return res.json({Status: "Success", Result: result})
    })
})

app.get('/examslot/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM examdetails WHERE id = ?";
    con.query(sql,[id], (err, result) => {
        if(err) return res.json({Error: "Get exams error in sql"});
        else{
            const values = [
                result[0].date,
                result[0].slot,
                result[0].date,
                result[0].facultymail
            ]
            const sql1 = "SELECT * FROM examdetails WHERE ((date = (?) AND slot <> (?)) OR (date <> (?))) AND facultymail <> (?) LIMIT 0, 25;";
            con.query(sql1, values, (err, result1) => {
                if(err) return res.json({Error: "Get exams error in sql"});
                else{
                    // console.log(result1)
                    return res.json({Status: "Success", Result: result1})
                }
            })
        }
    })
})


app.get('/getstatus/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM employee WHERE id = ?";
    con.query(sql,[id], (err, result) => {
        if(err) return res.json({Error: "Get exams error in sql"});
        else{
            var mail = result[0].email;
            const sql1 = "select * from examdetails where id in (SELECT texamid FROM requests WHERE fmail =(?));";
            con.query(sql1, [mail], (err, result1) => {
                if(err) return res.json({Error: "Get exams error in sql1"});
                else{
                    console.log(result1)
                    return res.json({Status: "Success", Result: result1})
                }
            })
        }
    })
})

app.post('/setrequest/:id1/:id2/:id3', (req, res) => {
    console.log("sdxfcgvhbjnkm")
    const fid = req.params.id1;
    const tid = req.params.id2;
    const tmail = req.params.id3;
    const sql = "SELECT * FROM examdetails WHERE id = ?";
    con.query(sql,[fid], (err, result) => {
        if(err) return res.json({Error: "Get exams error in sql"});
        else{
            var fmail = result[0].facultymail;
            const values = [
                fmail,
                tmail,
                fid,
                tid
            ]
            const sql1 = "INSERT INTO requests (`fmail`,`tmail`,`fexamid`,`texamid`) VALUES (?)";
            con.query(sql1, [values], (err, result1) => {
                if(err) return res.json({Error: err});
                else{
                    console.log(result1)
                    return res.json({Status: "Success", Result: result1})
                }
            })
        }
    })
})


app.listen(8081, ()=> {
    console.log("Running");
})
