import dotenv from "dotenv"; // Import the dotenv library to load environment variables.
import connectDB from "./db/index.js"; // Import the database connection function.
import { app } from "./app.js"; // Import the Express.js application instance.

dotenv.config({
    path: "./env" // Specify the path to the environment file.
});

// Establish a connection to the database.
connectDB()
.then(() => { 
    // Handle potential errors that might occur within the Express.js application.
    app.on("error", (error) => {
        console.error("Error: ", error); // Log the error to the console.
        throw error; // Re-throw the error to stop the server.
    });

    // Start the server on the specified port (or default to port 8000).
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error("MongoDB connection failed: ", error); // Log the error to the console.
    process.exit(1); // Exit the process with an error code.
});