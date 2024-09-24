const mongoose = require("mongoose")

mongoose.connect("process.env.MOONGODB_URL");

const UserSchema = mongoose.Schema({
    name:String,
    userName: String,
    email: String,
    age: Number,
    password: String,
    post:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ]
})

module.exports = mongoose.model("User",UserSchema)
