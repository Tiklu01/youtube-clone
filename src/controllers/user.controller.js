// Importing necessary utilities and models
import { asyncHandler } from "../utils/asyncHandler.js"; // Utility function to handle async errors in Express
import { ApiError } from "../utils/ApiError.js"; // Custom error handling class
import { User } from "../models/user.model.js"; // User model for database interaction
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Function to upload images to Cloudinary
import { ApiResponse } from "../utils/ApiResponse.js"; // Standardized API response format

const generateAccessAndRefreshTokens = async(userId) => { // Function to generate access and refresh tokens for a user
    try {
        const user = await User.findById(userId); // Find the user by ID
        const accessToken = user.generateAccessToken(); // Generate an access token
        const refreshToken = user.generateRefreshToken(); // Generate a refresh token
        user.refreshToken = refreshToken; // Save the refresh token to the user document object in user model 
        await user.save({validateBeforeSave: false}); // Save the updated user object to the database (validateBeforeSave: false skips validation)
        return {accessToken, refreshToken}; // Return the generated tokens   
    } catch (error) {
        throw new ApiError(500, "Token generation failed");
    }
} 

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

const loginUser = asyncHandler(async (req, res) =>{
    const {email,username,password} = req.body; // fetch data from req body
    if(!email || !username){ // check if email or username is not provided
        throw new ApiError(400,"Email or username is required");
    }
    const user = await User.findOne( // find user by email or username
        { $or: [{email},{username}]}
    )
    if(!user){ // check if user does not exist
        throw new ApiError(400, "user does not exist");
    }
    // check if password is correct
    const isPasswordValid =  await user.verifyPassword(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }
    // generate access and refresh tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    //finding user again cuz the old reference is not updated as the generate tokens functions is called after the prev reference so new reference is needed
    const LoggedInUser = await User.findById(user._id).select("-password -refreshToken"); // select is used to exclude fields from the response
    const options = {
        httpOnly: true, // cookie is not accessible via client side script
        secure: true, // cookie will only be sent over https
    }
    return res  // send response
           .status(200)
           .cookie('accessToken', accessToken, options) // set access token in cookie
           .cookie('refreshToken', refreshToken, options) // set refresh token in cookie
           .json(new ApiResponse(200, {
                user: LoggedInUser, accessToken, refreshToken // send user data, access token and refresh token in response despite setting them in cookie cuz someone might use it for mobile app or local storage in general good practice to send them in response
           },
              "User logged in successfully"       
        ))
           
})

const logoutUser = asyncHandler(async (req, res) => {
    await  User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {new: true}
    )
    const options = {
        httpOnly: true, // cookie is not accessible via client side script
        secure: true, // cookie will only be sent over https
    }
    return res
           .status(200)
           .clearCookie('accessToken', options) // clear access token cookie
           .clearCookie('refreshToken', options) // clear refresh token cookie
           .json(new ApiResponse(200, {}, "User logged out successfully"))
})
// Exporting the registerUser function so it can be used in route files
export { registerUser, loginUser, logoutUser };
