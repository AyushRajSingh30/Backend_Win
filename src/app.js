import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
const app =express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//Some setting for cookies and data come frome were and how much data come
//data come in json form and we set limit  which limit data accepted
app.use(express.json({ limit: "16kb" }))

//data come from url and we set limit  urlencoded encode url in better form

app.use(express.urlencoded({ extended: true, limit: "16kb" }))

//static used for static file like image and so more 

app.use(express.static("public"))

//set cookie at user side this is used for CRUD opreations
//cookie-parser module extracts cookies from incoming HTTP requests 
//These cookies are automatically sent by the client's browser along with the request.
app.use(cookieParser())

export {app};