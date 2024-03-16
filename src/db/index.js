import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

//async await is used because database avilabel in different continent
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGOBD_URL}/${DB_NAME}`)
        console.log(`\n MongoDB connection !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connect error", error);
        //process is node this used at the place of throw error
        process.exit(1);
    }

}
export default connectDB;