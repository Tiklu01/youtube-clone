import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env"
});

connectDB();


















/*
const app = express();

(async () => {
    try{
       await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
       app.on("error", (error) => {
              console.error("Error: ", error);
                throw error;
       })

         app.listen(3000, () => {
                  console.log(`Server is running on port ${process.env.PORT || 8000}`);
         })
    } catch(error){
        console.error("Error: ", error);
        throw error;
    }
})()
*/