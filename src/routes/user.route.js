// Importing the Router module from Express to create route handlers
import { Router } from "express";

// Importing the registerUser function from the user controller
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAcessToken } from "../controllers/user.controller.js";
// Creating an instance of an Express router
const router = Router();

// Defining a route for user registration
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 }, // Uploading a single avatar image
        { name: "coverImage", maxCount: 1 }, // Uploading a single cover image (optional)
    ]),
    registerUser // The controller function handling user registration
);


router.route("/login").post(loginUser); // Route for user login
// 🟢 When a POST request is sent to "/login", the `loginUser` function is executed.
// 🟢 This function verifies the user's credentials and returns access & refresh tokens.

// 🔒 Secured routes (require authentication)
router.route("/logout").post(verifyJWT, logoutUser); // Route for user logout
// 🟢 The `verifyJWT` middleware ensures the request has a valid JWT token.
// 🟢 If authenticated, `logoutUser` clears the user's refresh token from the database and removes cookies.


router.route("/refresh-token").post(refreshAcessToken); // Route for refreshing access tokens
// 🟢 When a POST request is sent to "/refresh-token", the `refreshAcessToken` function is executed.
// 🟢 This function verifies the refresh token and generates a new access token.


/*
 * upload.fields() is a Multer middleware function that allows handling multiple file uploads.
 * It takes an array of objects where each object specifies a field name and the maximum number of files allowed for that field.
 * In this case:
 * - "avatar" can have a maximum of 1 file.
 * - "coverImage" can have a maximum of 1 file.
 * This ensures that users cannot upload more than the allowed number of files for each field.
 */

// Exporting the router so it can be used in other parts of the application
// This will be imported as 'userRouter' in index.js (or app.js)
export default router;
