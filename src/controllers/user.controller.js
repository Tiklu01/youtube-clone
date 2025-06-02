// Importing necessary utilities and models
import { asyncHandler } from "../utils/asyncHandler.js"; // Utility function to handle async errors in Express
import { ApiError } from "../utils/ApiError.js"; // Custom error handling class
import { User } from "../models/user.model.js"; // User model for database interaction
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Function to upload images to Cloudinary
import { ApiResponse } from "../utils/ApiResponse.js"; // Standardized API response format
import jwt from 'jsonwebtoken'; // Importing JWT for token generation
import mongoose from "mongoose";

// 🟢 Function to generate access and refresh tokens for a user
const generateAccessAndRefreshTokens = async (userId) => {
    try { 
        // Fetch user from database using userId
        const user = await User.findById(userId);

        // Generate a new access token using the user model method
        const accessToken = user.generateAccessToken();

        // Generate a new refresh token
        const refreshToken = user.generateRefreshToken();

        // Save the generated refresh token to the user document in the database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // Skips validation to avoid errors

        // Return both tokens for further use
        return { accessToken, refreshToken };    
    } catch (error) {
        // Throw an error if token generation fails
        throw new ApiError(500, error?.message || "Token generation failed");
    }
}

// 🟢 Function to register a new user
const registerUser = asyncHandler(async (req, res) => {
    // Extract user details from request body
    const { username, email, password, fullName } = req.body;
    console.log("req.body = ", req.body); // Log for debugging

    // Ensure none of the required fields are empty
    if ([username, email, password, fullName].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if a user with the same email or username already exists
    const existedUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existedUser) {
        throw new ApiError(400, "User with same email or username already exists");
    }

    // Retrieve file paths for avatar and cover image from the request
    const avatarLocalPath = req.files?.avatar?.[0]?.path; // Avatar is required
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path; // Cover image is optional
    console.log("req.files = ", req.files); // Log uploaded files for debugging

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
        username: username.toLowerCase(),
        email,
        password, // Password should ideally be hashed before saving
        fullName,
        avatar: avatar.url, // Store avatar URL
        coverImage: coverImage?.url || "", // Store cover image URL or empty string
    });

    // Fetch the newly created user, excluding sensitive fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User registration failed");
    }

    // Return success response with user data
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

// 🟢 Function to log in a user
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    console.log(email, username, password);

    // Ensure email or username is provided
    if (!email && !username) {
        throw new ApiError(400, "Email or username is required");
    }

    // Find user by email or username
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (!user) {
        throw new ApiError(400, "User does not exist");
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Fetch updated user data excluding sensitive fields
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    console.log(loggedInUser);

    // Cookie options for security
    const options = {
        httpOnly: true,
        secure: true,
    };

    // Send response with tokens in cookies and body
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

// 🟢 Function to log out a user
const logoutUser = asyncHandler(async (req, res) => {
    // Remove refresh token from user record
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });

    // Cookie options for security
    const options = {
        httpOnly: true,
        secure: true,
    };

    // Clear cookies and send success response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// 🟢 Function to refresh an access token
const refreshAcessToken = asyncHandler(async (req, res) => {
    // Extract refresh token from cookies or request body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh token is required");
    }

    try {
        // Verify refresh token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Find user by ID from the decoded token
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Ensure refresh token matches the stored one
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired");
        }

        // Cookie options for security
        const options = {
            httpOnly: true,
            secure: true,
        };

        // Generate new access and refresh tokens
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        // Send new tokens in response and set cookies
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token generated successfully"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changePassword = asyncHandler(async (req, res) => {
    // Extract old and new password from request body
    const { oldPassword, newPassword } = req.body;
    
    // Find the user by ID from the request object
    const user = await User.findById(req.user?._id);
    
    // Verify if the old password matches the stored password
    const isPasswordCorrect = await user.verifyPassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password"); // Throw error if password is incorrect
    }
    
    // Update the user's password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false }); // Save the updated password without validation errors
    
    // Respond with a success message
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
 });
 
 const getCurrentUser = asyncHandler(async (req, res) => {
    // Return the currently logged-in user details
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
 });
 
 const UpdateAccountDetails = asyncHandler(async (req, res) => {
    // Extract full name and email from request body
    const { fullName, email } = req.body;
    
    // Ensure both fields are provided
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }
    
    // Update user details in the database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullName, email }, // Set new values for fullName and email
        },
        { new: true } // Return the updated document
    ).select("-password"); // Exclude password from the response
 
    // Respond with updated user details
    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
 });
 
 const updateUserAvatar = asyncHandler(async (req, res) => {
    // Get the avatar file path from request
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required"); // Ensure avatar is provided
    }
    
    // Upload avatar to cloud storage
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar"); // Ensure upload was successful
    }
    
    // Update user record with new avatar URL
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url },
        },
        { new: true }
    ).select("-password");
 
    // Respond with updated user details
    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
 });
 
 const updateUserCoverImage = asyncHandler(async (req, res) => {
    // Get the cover image file path from request
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image is required"); // Ensure cover image is provided
    }
    
    // Upload cover image to cloud storage
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image"); // Ensure upload was successful
    }
    
    // Update user record with new cover image URL
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImage.url },
        },
        { new: true }
    ).select("-password");
 
    // Respond with updated user details
    return res.status(200).json(new ApiResponse(200, user, "Cover Image updated successfully"));
 });

 const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params; // Extract username from request parameters, when we go to a channel profile website, the URL usually contains the username of the channel, like /channel/username we take that info from params
    if(!username?.trim()) {
        throw new ApiError(400, "Username is missing"); // Ensure username is provided
    }
    // Find user by username
    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase() // Match the username in lowercase
            }
        },
        {  //This lookup is for finding subscriber count of the channel
            $lookup:{
                from: "subscriptions", // Join with subscriptions collection
                localField: "_id", // Match user ID
                foreignField: "channel", // Match channel field in subscriptions
                as: "subscribers" // Output field for subscribers
            }
        },
        {  // This lookup is for finding the channels the user is subscribed to
            $lookup:{
                from: "subscriptions", // Join with subscriptions collection again
                localField: "_id", // Match user ID
                foreignField: "subscriber", // Match subscriber field in subscriptions
                as: "subscribedTo" // Output field for subscribed channels
            }
        },
        { // addFields stage to calculate subscriber and subscription counts and include them in the output
            // This stage adds fields to the output document
            // It calculates the number of subscribers and the number of channels the user is subscribed to
            // using the $size operator
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers" // Count the number of subscribers
                 },
                 channelsSubscribedToCount: {
                    $size: "$subscribedTo" // Count the number of channels subscribed to
                 },
                 isSubscribed: {
                    $cond: { //conditional operator to check if the user is subscribed to the channel
                        if: { //if condition
                            $in: [req.user?._id, "$subscribers.subscriber"] // Check if the user ID is in the subscribers list
                        },
                        then: true, // If true, user is subscribed
                        else: false // If false, user is not subscribed
                    }
                 }
            }
        },
        { // Project stage to include only necessary fields in the output you can also exclude fields you don't want using 0 and 1 includes the fields you want in the output
            // This stage specifies which fields to include in the final output document
            $project: {
                username: 1, // Include username
                fullName: 1, // Include full name
                avatar: 1, // Include avatar URL    
                coverImage: 1, // Include cover image URL
                subscriberCount: 1, // Include subscriber count
                channelsSubscribedToCount: 1, // Include channels subscribed to count
                isSubscribed: 1, // Include subscription status
                email: 1 // Include email
            }
        }
    ])
    if(!channel?.length) {
        throw new ApiError(404, "Channel not found"); // If no channel is found, throw an error
    }
    return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile fetched successfully")); // Return the channel profile
 })
 const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: await new mongoose.Types.ObjectId(req.user._id) // mongoDB ID's are of type ObjectId, so we need to convert the string ID to ObjectId mongoose does that for us
            }
        },
        {
            $lookup:{
                from: "videos", // Join with watch history collection
                localField: "watchHistory", // Match user watch history field
                foreignField: "_id", // Match video ID field in watch history
                as: "watchHistory", // Output field for watch history
                // writing pipeline here will work on the watchHistory array
                pipeline: [ // Pipeline to include owner details in the watch history
                    {
                        $lookup:{
                            from: "users", // Join with users collection to get video uploader details
                            localField: "owner", // Match video owner field
                            foreignField: "_id", // Match user ID field in users
                            as: "owner", // Output field for video 
                            // writing pipeline here will work on the owner array
                            pipeline: [ // Pipeline to project only necessary fields from the owner
                                {
                                    $project: { // Project stage to include only necessary fields in the output
                                        username: 1, // Include username
                                        fullName: 1, // Include full name
                                        avatar: 1, // Include avatar URL
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: { // Add fields to the output document
                            owner: {
                                $first: "$owner" // Get the first owner from the array as there should be only one owner per video
                            }
                        }
                    }
                   
                ]
            }
        }
    ])
    return res.status(200).json( new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
 });
// Exporting all functions for use in routes
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken,
    changePassword,
    getCurrentUser,
    UpdateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
    };
