// require('dotenv).config({path:."/env"})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
 


dotenv.config({
    path: './env'
})

/*use app.on to listen for specific events like 'error', 'listening', 'close', etc.,
 but it's not necessary for defining route handlers or middleware.*/

connectDB()
    // .then(() => {
    //     app.on("error", (error) => {
    //         console.log("ERROR", error);
    //         throw error;
    //     })

    //     app.listen(process.env.PORT || 8000, () => {
    //         console.log(`server is running on port : ${process.env.PORT}`);
    //     })
    // })
    // .catch((error) => {
    //     console.log("MONGO ERROR connection fail !!!", error);

    // })



























/*
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import express from "express";
const app = express();

//async await is used because database avilabel in different continent
 ;( async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
 //if database connected with mongodb bux express app not listen than we apply app.on
       app.on("error",(error)=>{
        console.log("ERROR", error);
        throw error;
       })

       app.listen(process.env.PORT,()=>{
        console.log(`App listening on ${process.env.PORT}`);
       })
        
    } catch (error) {
        console.error("ERROR", error);
        throw error;
    }
 })()

 */ 