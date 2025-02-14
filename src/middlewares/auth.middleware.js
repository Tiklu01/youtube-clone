import { asyncHandler } from "../utils/asyncHandler.js"; 
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";
export const verifyJWT = asyncHandler(async (req, res, next) => {
   
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") // Extract the access token from the request cookies or headers 
    if(!token){
     throw new ApiError(401, "Unauthorized request"); // If no token is found, throw an unauthorized error
    }
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const user =  await User.findById(decodedToken?._id).select("-password -refreshToken ") // Find the user by the decoded token
    if(!user){
       //TODO discission abaout frontend
     throw new ApiError(401, "Invalid acess Token "); // If no user is found, throw an unauthorized error
    }
    req.user = user; // Set the user in the request object
    next(); // Call the next middleware
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid acess Token"); // If an error occurs, throw an unauthorized error
  }
}) 