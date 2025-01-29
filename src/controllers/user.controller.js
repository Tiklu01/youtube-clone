// Importing the asyncHandler utility to handle asynchronous errors in Express routes
import { asyncHandler } from "../utils/asyncHandler.js";

// Defining the registerUser function, which handles user registration
// Wrapping it inside asyncHandler to catch errors and prevent unhandled promise rejections
const registerUser = asyncHandler(async (req, res) => {
    // Sending a JSON response with a success message
    res.status(200).json({
        message: "user registered succesfully", // Response message
    });
});

// Exporting the registerUser function so it can be used in route files
export { registerUser };
