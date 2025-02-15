// Importing necessary utilities and models
import { asyncHandler } from "../utils/asyncHandler.js"; // Utility function to handle async errors in Express
import { ApiError } from "../utils/ApiError.js"; // Custom error handling class
import { User } from "../models/user.model.js"; // User model for database interaction
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Function to upload images to Cloudinary
import { ApiResponse } from "../utils/ApiResponse.js"; // Standardized API response format
import jwt from 'jsonwebtoken'; // Importing JWT for token generation

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

// Exporting all functions for use in routes
export { registerUser, loginUser, logoutUser, refreshAcessToken };
