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
var Sid =-1;

var userNameT="";
var Tid=-1;

var adminId =-1;

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
        res.render("home_bst.ejs",{});
    }    
});
    //teacher login handler
app.post("/login_teacher",async (req,res)=>{
    try{
        var query = "select * from teacher WHERE id = $1 AND password= $2";
        var row = await db.query(query,[req.body.teacher_id,req.body.password]);
        //after authentication
        if(row.rows.length != 0){
            var queApp ="SELECT * FROM appointments WHERE teacher_id=$1 AND status='approved'";
            var Result = await db.query(queApp,[req.body.teacher_id]);
            if(Result){
                if(Result.rows.length!=0){
                    res.render("teacher_portal_approved.ejs",{name : row.rows[0].name,datas:Result.rows});
                    console.log("sign in successfull,"+ row.rows[0].name);
                }else{
                    res.render("teacher_portal_approved.ejs",{name : row.rows[0].name});
                }
            }else{
                console.log("something went off!");
            }
            userNameT=row.rows[0].name;
            Tid=row.rows[0].id;
        }
    }catch(error){
        console.log(error.message);
    }
});




    //admin login handler
app.post("/login_admin",async (req,res)=>{
    try{
        var query = "select * from admin WHERE id = $1 AND password= $2";
        var row = await db.query(query,[req.body.admin_id,req.body.password]);
        //after authentication
        if(row.rows.length != 0){
            res.render("admin_portal_add.ejs",{});
            console.log("sign in successfull,Admin");
            adminId = req.body.admin_id;
        }else{
            console.log("password does not match");
            res.render("home_bst.ejs",{message : "Password Incorrect"});
        }
    }catch(error){
        console.log(error);
    }    
});

app.post("/registerS",async(req,res)=>{
    try{
        var que ="INSERT INTO student(name,password) VALUES($1,$2);";
        var result = await db.query(que,[req.body.Student_name,req.body.password]);
        if(result){
            console.log("registered student successfully");
            res.render("home_bst.ejs",{});
        }else{
            console.log("Something went wrong");
        }
    }catch(error){
        console.log(error.message);
    }
})

app.get("/go_toRegister",(req,res)=>{
    try{
        res.render("student_register.ejs",{});
    }catch(error){
        console.log(error.message);
    }
})



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

app.get("/back_toBook",(req,res)=>{
    try{
        res.render("student_portal_book.ejs",{name: userName,});
    }catch(error){
        console.log(error.message);
    }
});

app.get("/logoutS",(req,res)=>{
    Sid=-1;
    userName="";
    res.render("home_bst.ejs",{});
});







/*------------------------------------------------------------------------------*/
//TEACHER portal 
app.get("/back_toAppointments",async (req,res)=>{
    try{
        var queApp ="SELECT * FROM appointments WHERE teacher_id=$1 AND status='approved'";
        var Result = await db.query(queApp,[Tid]);
        if(Result){
            if(Result.rows.length!=0){
                res.render("teacher_portal_approved.ejs",{name:userNameT,datas:Result.rows});
                console.log("sign in successfull,"+ row.rows[0].name);
            }else{
                res.render("teacher_portal_approved.ejs",{name:userNameT});
            }
        }else{
            console.log("something went off!");
        }
    }catch(error){
        console.log(error.message);
    }
});
     

app.get("/logoutT",(req,res)=>{
    userNameT="";
    Tid=-1;
    res.render("home_bst.ejs",{});
});//with this, login functionality has been finished


app.get("/Tpending",async (req,res)=>{
    try{
        var que="SELECT * FROM appointments WHERE teacher_id=$1 AND status='pending'";
        console.log(Tid);
        var result = await db.query(que,[Tid]);
        if(result){
            if(result.rows.length!=0){
                res.render("teacher_portal_pending.ejs",{name:userNameT,datas:result.rows});
            }else{
                res.render("teacher_portal_pending.ejs",{name:userNameT});
                console.log("no pending");
            }
        }
        
    }catch(error){
        console.log(error.message);
    }
});

app.post("/approve",async (req,res)=>{
    try{
        var que = "UPDATE appointments SET status='approved' WHERE a_id =$1;";
        var result = await db.query(que,[req.body.appointment_id]);
        if(result){
            var nque = "SELECT * FROM appointments WHERE teacher_id=$1 AND status='pending'";
            var newResult = await db.query(nque,[Tid]);
            if(newResult){
                if(newResult.rows.length!=0){
                    res.render("teacher_portal_pending.ejs",{datas:newResult.rows});
                    console.log("approved");
                }else{
                    res.render("teacher_portal_pending.ejs",{});
                    console.log("nah");
                }
            }else{
                res.send("<p>error</p>")
                console.log("smthng wong!")
            }
        }else{
            console.log("Something went wrong");
        }
    }catch(error){
        console.log(error.message);
    }
});

app.post("/cancel",async (req,res)=>{
    try{
        var que = "UPDATE appointments SET status='cancelled' WHERE a_id =$1;";
        var result = await db.query(que,[req.body.appointment_id]);
        if(result){
            var nque = "SELECT * FROM appointments WHERE teacher_id=$1 AND status='pending'";
            var newResult = await db.query(nque,[Tid]);
            if(newResult){
                if(newResult.rows.length){
                    res.render("teacher_portal_pending.ejs",{datas:newResult.rows});
                    console.log("cancelled");
                }else{
                    res.render("teacher_portal_pending.ejs",{});
                    console.log("cancelled");
                }
            }else{
                res.send("<p>error</p>")
                console.log("smthng wong!")
            }
        }else{
            console.log("Something went wrong");
        }
    }catch(error){
        console.log(error.message);
    }
});











/*------------------------------------------------------------------------------*/
//ADMIN portal 

app.get("/back_toAdd",async (req,res)=>{
    try{
        res.render("admin_portal_add.ejs",{});
    }catch(error){
        console.log(error);
    }
});

app.get("/removeT",(req,res)=>{
    try{
        res.render("admin_portal_remove.ejs",{});
    }catch(error){
        console.log(error.message);
    }
});

app.get("/logoutA",(req,res)=>{
    try{
        adminId=-1;
        res.render("home_bst.ejs",{});
    }catch(error){
        console.log(error.message);
    }
})


app.post("/admin_addT",async (req,res)=>{
    try{
        var que = "INSERT INTO teacher(name,subject,password) VALUES($1,$2,$3)";
        var Result = await db.query(que,[req.body.Teacher_name,req.body.Teacher_subject,req.body.Teacher_password]);
        if(Result){
            console.log("Teacher added!");
            res.render("admin_portal_add.ejs",{message:"yes"});
        }else{
            console.log("what happended?!");
        }
    }catch(error){
        console.log(error.message);
    }
});

app.post("/admin_removeT",async (req,res)=>{
    try{
        var ApDel ="DELETE FROM appointments WHERE teacher_id =$1;";
        var aResult = await db.query(ApDel,[req.body.Teacher_id]);
        if(aResult){
            var que = "DELETE FROM teacher WHERE id=$1";
            var result = await db.query(que,[req.body.Teacher_id]);
            if(result){
                res.render("admin_portal_remove.ejs",{message:"yes"});
            }else{
                console.log("whaaa?");
            }
        }else{
            console.log("eee");
        }
    }catch(error){
        console.log(error.message);
    }
})










/*---------------------------------------------------------------*/

app.listen(port,()=>{
    console.log("The app has started at port "+port);
})
