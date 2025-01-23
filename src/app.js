import express from 'express'; // Import the necessary library for creating an Express.js application
import { DB_NAME } from './constants'; // Import a constant value (likely the database name) from another file
import cookieParser from 'cookie-parser'; // Import a library for handling cookies

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

// Export the Express.js application instance for use in other parts of the application
export {app};