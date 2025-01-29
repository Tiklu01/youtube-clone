// Importing the multer package to handle file uploads
import multer from "multer";

// Configuring storage settings for multer
const storage = multer.diskStorage({
    // Setting the destination where uploaded files will be stored
    destination: function (req, file, cb) {
        // The uploaded files will be stored in the "public/temp" directory
        cb(null, "./public/temp");
    },
    
    // Defining how the uploaded file should be named
    filename: function (req, file, cb) {
        // The uploaded file will retain its original name
        cb(null, file.originalname);
    }
});

// Creating an instance of multer with the specified storage configuration
export const upload = multer({ storage });
