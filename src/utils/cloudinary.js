import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'; // File system module


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Click 'View API Keys' above to copy your cloud name
        api_key: process.env.CLOUDINARY_API_KEY, // Click 'View API Keys' above to copy your API key
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    }); 
    // Upload image to cloudinary

    const uploadOnCloudinary = async (localfFilePath) => {
        try {
           if(!localfFilePath) return null;
           //upload the file to cloudinary
         const response =  await cloudinary.uploader.upload(localfFilePath,{ //upload is a method that uploads file to cloudinary
            resource_type: "auto",
           })
           console.log("File uploaded on cloudinary successfully", response.url); //response.url is the cloudinary url of the uploaded file
           return response;
        } catch (error) {
            fs.unlinkSync(localfFilePath); //unlinkSync is a method that deletes the file from the local system
            throw new Error(error.message);
        }
    }
    
export {uploadOnCloudinary};

