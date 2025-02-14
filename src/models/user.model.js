import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        Unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        Unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String, //cloudinary url
        required: true,
    },
    coverImage: {
        type: String, //cloudinary url
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    refreshToken: {
        type: String,
    },

},{timestamps: true});

UserSchema.pre("save", async function(next){ //.pre is a middleware that runs before the save method can be used with other keywords except save
    if(this.isModified("password")){ // isModified is a method that checks if the any field has been modified and we pass password in string format as an argument to check passowrd modifed or not
        this.password = await bcrypt.hash(this.password, 10); //hashing password before saving
    }
    next();
   }); 
   // custom methods
UserSchema.methods.generateAccessToken = function(){  // generateAccessToken is a method that generates access token for user
    return jwt.sign( //jwt.sign is a method that generates token
        {  //payload
            _id: this._id,
            username: this.username,
            email: this.email,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET, //secret key
        {
            expiresIn: ACCESS_TOKEN_EXPIRY, //expiry time
        }
    )
}

UserSchema.methods.generateRefreshToken = function(){ // generateRefreshToken is a method that generates refresh token for user
    return jwt.sign( //jwt.sign is a method that generates token
        {  //payload
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET, //secret key
        {
            expiresIn: REFRESH_TOKEN_EXPIRY, //expiry time
        }
    )
}
UserSchema.methods.verifyPassword = async function(password){ //verifyPassword is a method that verifies the password
    return await bcrypt.compare(password, this.password); //bcrypt.compare is a method that compares the password
}
export const User =  mongoose.model('User', UserSchema);