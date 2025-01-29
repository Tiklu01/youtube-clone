import express from 'express'; // Import the necessary library for creating an Express.js application
import cookieParser from 'cookie-parser'; // Import a library for handling cookies
import cors from 'cors'; // Import a library for enabling Cross-Origin Resource Sharing (CORS)
// Create an instance of the Express.js application
const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for security and to allow requests from different origins
app.use(cors({
    origin: process.env.CORS_ORIGIN, // Allow requests from the specified origin (usually an environment variable)
    credentials: true // Allow credentials (like cookies) to be included in the request
}));

// Parse incoming JSON data in the request body 
app.use(express.json({limit: "16kb"})); // Limit the size of incoming JSON data to 16kb

// Parse incoming URL-encoded data in the request body 
app.use(express.urlencoded({extended: true})); 

app.use(express.static('public')); // Serve static files from the "public" directory

app.use(cookieParser()); // Parse cookies in the request headers 

//routes imports
import userRouter from './routes/user.route.js'; //userRoiter is not explicitly defined in user.route.js but it is exported as default so we can name it anything while importing


//routes declarations
app.use("/api/v1/users",userRouter); // here using use instead of get because we are using router and router is a middleware

// Export the Express.js application instance for use in other parts of the application
export {app};