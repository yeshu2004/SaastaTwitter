const User = require("./models/user.models")
const Post = require("./models/post.models")

const bcrypt= require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")

const express = require("express");
const path = require("path")
const app = express()

app.set("view engine","ejs")
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieParser());

app.get("/",(req,res)=>{
    res.render("index");
})

app.post("/register",async (req,res)=>{
    let { name ,userName ,email ,age ,password } = req.body;
    let user = await User.findOne({email});
    if(user) return res.status(500).send("User already exits")

    bcrypt.genSalt(10,function(err, salt){
        bcrypt.hash(password,salt, async function(err,hash){
            let createdUser = await User.create({
                name,
                userName,
                email,
                password: hash,
            });
            let token = jwt.sign({email: email,userid: createdUser._id},"shhhh")
            res.cookie("token",token)
            res.redirect("/login")
        })
    })
    

})

app.get("/login",(req,res)=>{
    res.render("login")
})

app.get("/logout",(req,res)=>{
    res.cookie("token","")
    res.redirect("/login")
})

app.post("/login",async (req,res)=>{
    let { email ,password } = req.body;
    let user = await User.findOne({email});
    if(!user) return res.status(500).send("Someting went wrong")

    bcrypt.compare(password, user.password , function(err,result){
        if(result) {
            let token = jwt.sign({email: email,userid: user._id},"shhhh")
            res.cookie("token",token)
            res.redirect("/profile")
        }
        else res.redirect("/login")
    })
})

app.get("/profile",isLoggedIn, async (req,res)=>{
    let user = await User.findOne({email: req.user.email}).populate("post")
    res.render("profile",{user})
})

app.post("/createpost",isLoggedIn, async (req,res)=>{
    let user = await User.findOne({email: req.user.email})
    let post = await Post.create({
        user: user._id,
        content: req.body.post
    })
    user.post.push(post._id);
    await user.save()
    res.redirect("/profile")
})


app.get("/home", isLoggedIn , async (req,res)=>{
    let user = await User.findOne({email: req.user.email})
    let alluser = await User.find().populate("post")
    res.render("home",{user, alluser})    
})

app.get("/edit/:id",isLoggedIn, async (req,res)=>{
    let post = await Post.findOne({ _id: req.params.id }).populate("user")
    res.render("edit",{post})
})


app.post("/update/:id", isLoggedIn, async (req,res)=>{
    let post = await Post.findOneAndUpdate({ _id: req.params.id},{content : req.body.post })
    await post.save()
    res.redirect("/profile")
})

app.get("/like/:id", isLoggedIn, async (req,res)=>{
    let post = await Post.findOne({ _id: req.params.id }).populate("user")

    if( post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid)
    } else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1)
    }

    await post.save();
    res.redirect("/home")
    
})

function isLoggedIn(req, res, next) {
    const token = req.cookies?.token;

    if (!token) return res.status(401).send("You must be logged in");

    const data = jwt.verify(token, "shhhh");
    req.user = data;
    next();
}

app.listen(4000,function(){
    console.log("App running at 6000 port")
})