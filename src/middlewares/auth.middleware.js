import { asyncHandler } from "../utils/asyncHandler.js"; // A utility to handle async errors
import { ApiError } from "../utils/ApiError.js"; // Custom error handler
import jwt from "jsonwebtoken"; // Library to work with JWTs
import { User } from "../models/user.model.js"; // Import the User model

// Middleware function to verify JWT
export const verifyJWT = asyncHandler(async (req, res, next) => {  
  try {
    // 🟢 Extract token from request
    const token =
      req.cookies?.accessToken ||  // First, check if token is stored in cookies
      req.header("Authorization")?.replace("Bearer ", ""); // Else, check if it exists in the Authorization header
    
    // ❌ If no token is found, reject the request with a 401 Unauthorized error
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // 🟢 Verify and decode the token using the secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 🟢 Find the user in the database based on the decoded token's `_id`
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken"); 
    // `-password -refreshToken` removes the password and refreshToken fields from the user data

    // ❌ If user is not found in the database, reject the request
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // 🟢 Attach user data to the `req.user` object so that it can be accessed in the next middleware or route handler
    req.user = user;

    // 🟢 Call the `next()` function to proceed to the next middleware or route handler
    next();
  } catch (error) {
    // ❌ If token is invalid or any other error occurs, send a 401 Unauthorized response
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
// The `verifyJWT` middleware function performs the following steps:
// 1. Extracts the JWT from the request (either from the `Authorization` header or cookies).
// 2. Verifies and decodes the JWT using the secret key.
// 3. Finds the user in the database based on the decoded token's `_id`.
// 4. Attaches the user data to the `req.user` object for further processing.
// 5. Calls the `next()` function to proceed to the next middleware or route handler.
// If any error occurs during this process, it sends a 401 Unauthorized response with an error message.
