// Importing the Router module from Express to create route handlers
import { Router } from "express";

// Importing the registerUser function from the user controller
import { registerUser } from "../controllers/user.controller.js";

// Creating an instance of an Express router
const router = Router();

// Defining a route for user registration
// When a POST request is made to "/register", the registerUser function will handle it
router.route("/register").post(registerUser);

// Exporting the router so it can be used in other parts of the application
// This will be imported as 'userRouter' in index.js (or app.js)
export default router;
