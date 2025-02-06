// Importing the Router module from Express to create route handlers
import { Router } from "express";

// Importing the registerUser function from the user controller
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

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
