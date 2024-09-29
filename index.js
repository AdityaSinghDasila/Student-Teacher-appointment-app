import express from "express";
import bodyParser from "body-parser";
import {dirname} from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import ejs from "ejs";

const app = express();
const port = 3000;
const __dirname= dirname(fileURLToPath(import.meta.url));

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

//establishing database connection
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"Student-Teacher appointment",
    password : "aditya",
    port : "5432",
});

db.connect();

var userName ="";
var Sid =0;


//app starts and sends login page "home_bst"
app.get("/",(req,res)=>{
    res.render("home_bst.ejs",{});
});
    //student login handler
app.post("/login_student",async (req,res)=>{
    try{
        var query = "select * from student WHERE id = $1 AND password= $2";
        var row = await db.query(query,[req.body.student_id,req.body.password]);
        //after authentication
        if(row.rows.length != 0){
            res.render("student_portal_book.ejs",{name : row.rows[0].name});
            console.log("sign in successfull,"+ row.rows[0].name);
            userName=row.rows[0].name;
            Sid=row.rows[0].id;
        }else{
            console.log("password does not match");
            res.render("home_bst.ejs",{message : "Password Incorrect"});
        }
    }catch(error){
        console.log(error);
    }    
});
    //teacher login handler
app.post("/login_teacher",(req,res)=>{
    console.log("Form data found! " + req.body.teacher_id);
    //after authentication
    res.sendFile(__dirname + "/public/teacher_portal_approved.html");
});
    //admin login handler
app.post("/login_admin",(req,res)=>{
    console.log("Form data found! " + req.body.admin_id);
    //after authentication
    res.sendFile(__dirname + "/public/admin_portal_add.html");
});



/*------------------------------------------------------------------------------*/
//student portal 
    //we're at the booking page. Todos : submit button, reset button, status button, logout button, 


app.post("/search_teacher",async (req,res)=>{
    try{
        var quer = "SELECT id,name,subject FROM teacher WHERE name ILIKE '%'||$1||'%'";
        const result = await db.query(quer,[req.body.Teacher_name]);
        if(result){
            if(result.rows.length != 0){
                res.render("student_portal_book.ejs",{name : userName, datas : result.rows});
                // console.log(result.rows);
            }else{
                res.render("student_portal_book.ejs",{message : "no teacher found"});
            }
        }else{
            console.log("database problem!");
        }
    }catch(error){
        console.log(error.message);
    }
});

app.post("/book_appointment",async (req,res)=>{
    try{
        //checking student data is valid or not
        var checkQueryS = "SELECT * FROM student WHERE id = $1 AND name=$2";
        var checkRes1 = await db.query(checkQueryS,[req.body.Student_id,req.body.Student_name])

        //checking teacher id is valid or not
        var checkQueryT = "SELECT * FROM teacher WHERE id=$1 AND name=$2";
        var checkRes2 = await db.query(checkQueryT,[req.body.Teacher_id,req.body.Teacher_name]);
        if(checkRes1 && checkRes2){
            if(checkRes1.rows.length!=0 && checkRes2.rows.length!=0){
                console.log("The teacher and the student were both found");
                //converting date and time appropriately
                const [day, month, year] = req.body.appointment_date.split("-");
                const formattedDate = `${year}-${month}-${day}`;
                const formattedTime = `${req.body.appointment_time}:00`;
                //lets fill the appointment table now

                var aQuery = "INSERT INTO appointments(student_id,teacher_id,a_date,a_time,reason) VALUES($1,$2,$3,$4,$5)";
                var Result = await db.query(aQuery,[req.body.Student_id,req.body.Teacher_id,formattedDate,formattedTime,req.body.reason]);
                if(Result){
                    console.log("request posted successfully");
                    res.render("student_portal_book.ejs",{message : "Appointment Requested successfully"});
                }else{
                    console.log("Error in inserting appointment");
                }
            }
        }
    }catch(error){
        console.log(error.message);
    }   
});

app.get("/get_student_status",async (req,res)=>{
    try{
        console.log("The student id rn :"+Sid);
        var Que = "SELECT * FROM appointments WHERE student_id=$1";
        var Result = await db.query(Que,[Sid]);
        if(Result){
            if(Result.rows.length!=0){
                res.render("student_portal_status.ejs",{datas:Result.rows,});
            }else{
                res.render("student_portal_status.ejs",{});
            }
        }else{
            console.log("something went wrong while fetching");
        }
    }catch(error){
        console.log(error.message);
    }    
});


















/*---------------------------------------------------------------*/

app.listen(port,()=>{
    console.log("The app has started at port "+port);
})
