// Importing necessary utilities and models
import { asyncHandler } from "../utils/asyncHandler.js"; // Utility function to handle async errors in Express
import { ApiError } from "../utils/ApiError.js"; // Custom error handling class
import { User } from "../models/user.model.js"; // User model for database interaction
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Function to upload images to Cloudinary
import { ApiResponse } from "../utils/ApiResponse.js"; // Standardized API response format

// Defining the registerUser function, which handles user registration
// Wrapping it inside asyncHandler to automatically catch and handle errors
const registerUser = asyncHandler(async (req, res) => {
   // Extract user details from the request body
   const { username, email, password, fullName } = req.body; //req.body is an object that contains key-value pairs of data submitted in the request body it's raw/text form file upload is not supported in req.body
   console.log("req.body = ", req.body); // Log the request body to the console for debugging and learning purposes
   
   // Validation: Ensure none of the required fields are empty
   if ([username, email, password, fullName].some((field) => field?.trim() === "")) {
       throw new ApiError(400, "All fields are required");
   }

   // Check if a user with the same email or username already exists
   const existedUser = await User.findOne({
      $or: [{ username }, { email }], // $or operator checks if either username OR email matches an existing record
   });

   if (existedUser) {
       throw new ApiError(400, "User with same email or username already exists");
   }

   // Retrieve file paths of avatar and cover image (if provided) from the request
   const avatarLocalPath = req.files?.avatar?.[0]?.path; // Avatar is required
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path; // Cover image is optional
   console.log("req.files = ", req.files); // Log the uploaded files to the console for debugging and learning purposes (req.files is an object that contains key-value pairs of files uploaded in the request )
   if (!avatarLocalPath) {
       throw new ApiError(400, "Avatar is required");
   }

   // Upload avatar to Cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   
   // Upload cover image if provided, otherwise set it to null
   const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;
  
   if (!avatar) {
       throw new ApiError(500, "Avatar upload failed");
   }

   // Create a new user in the database
   const user = await User.create({
       username: username.toLowerCase(), // Convert username to lowercase for consistency
       email,
       password, // Storing hashed password directly (should ideally be hashed before saving)
       fullName,
       avatar: avatar.url, // Store only the URL of the uploaded avatar
       coverImage: coverImage?.url || "", // If cover image exists, store URL; otherwise, store an empty string
   });

   // Fetch the newly created user while excluding sensitive fields
   const createdUser = await User.findById(user._id).select(
       "-password -refreshToken" // Excluding password and refreshToken from the response using Mongoose select()
   );

   if (!createdUser) {
       throw new ApiError(500, "User registration failed");
   }

   // Return a success response with user data (excluding sensitive fields)
   return res.status(201).json(
       new ApiResponse(200, createdUser, "User registered successfully")
   );
});

// Exporting the registerUser function so it can be used in route files
export { registerUser };
