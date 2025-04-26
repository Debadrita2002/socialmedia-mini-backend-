const express =require('express')
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser')
const userModel = require("./models/user")
const postModel = require("./models/post")
const jwt =  require('jsonwebtoken')
const bcrypt =require('bcrypt');
const { log } = require('console');

app.set("view engine", "ejs");
app.use(express.json())
app.use(express.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser())



app.get("/", (req,res) => {
    res.render('index');
})
app.get("/login", (req,res) => {
    res.render('login');
})
app.get("/profile",isLoggedIn, async(req,res) => {
    let user=await userModel.findOne({email: req.user.email})
    console.log(user)
    res.render("profile",{user});
})

app.get("/logout", (req,res) => {
    res.cookie("token","")
    res.redirect('/login');
})

app.post("/register", async(req,res) => {
    let {username, email,password, name, age} =req.body;
    let user=await userModel.findOne({email})
    if(user){
        return res.status(500).send("user already registered")
    }

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async(err,hash)=>{
            if (err) return res.status(500).send("Error hashing password");
            let user = await userModel.create({
                username,
                name,
                email,
                password: hash,
                age
            })

            let token=jwt.sign({email:email, userid: user._id},"shhhh")
            res.cookie("token",token)


            res.send("registered");
        })
    }) 
})


app.post("/login", async(req,res) => {
    let {email,password} =req.body;
    let user=await userModel.findOne({email})
    if(!user){
        return res.status(500).send("something went wrong")
    }

    bcrypt.compare(password,user.password,function(err,result){
        if(result){
            let token= jwt.sign({email: email,userid: user._id},"shhhh")
            res.cookie("token",token)
            res.status(200).redirect("profile")
        }
            else res.redirect("/login")
    })
})

function isLoggedIn(req,res,next){
    if(req.cookies.token ==="" )  res.redirect("/login")
    else{
       let data=jwt.verify(req.cookies.token,"shhhh")
       req.user=data;
       next();
    }
}


app.listen(3009);
