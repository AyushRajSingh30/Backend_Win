import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.module.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponce } from "../utils/ApiResponce.js"
import { asynchandeler } from "../utils/asyncHandeler.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"


const publishAVideo = asynchandeler(async (req, res) => {
    const { title, description } = req.body
    // get video, upload to cloudinary, create video
    //1.title,description,thumbnail,videoFile,owne from user
    //2. cheak validation of all data

    if (!title && !description) {
        throw new ApiError(400, "title and description is required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    if (!videoLocalPath) {
        throw new ApiError(400, "videoFile is required")
    }

    const videouploded = await uploadOnCloudinary(videoLocalPath)

    //we comment if condition because we fase uploding issues on cloudanary
    // if (!videouploded) {
    //     throw new ApiError(400, "videoFile is required")
    // }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
 //we comment if condition because we fase uploding issues on cloudanary
    // if (!thumbnail) {
    //     throw new ApiError(400, "thumbnail is required");
    // }


    const video = await Video.create({
        videoFile: videouploded?.url || "",
        title: title,
        description: description,
        thumbnail: thumbnail?.url || "",
        owner: req.user._id
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponce(200, video, "User registered Successfully")
    )
})

const getVideoById = asynchandeler(async (req, res) => {
    const { videoId } = req.params
    // get video by id
         const video= await Video.findById(videoId)
            
         if (!video) {
            throw new ApiError(500, "Please provide a valid video id")
        }

         return res.status(201).json(
            new ApiResponce(200, video, "Get vedio Successfully")
        )
})

const updateVideo = asynchandeler(async (req, res) => {
    const { videoId } = req.params
    // update video details like title, description, thumbnail
    const {title, description}= req.body;
    if(!title && !description){
        throw new ApiError(400, "required title and description");
    }

     const video= await Video.findByIdAndUpdate(videoId,{
        $set:{
             title:title,
             description:description,
        }
    },
    {new: true})

    if(!video){
        throw new ApiError(500, "Somthing is wrong")
    }

    return res
     .status(200)
     .json(
        new ApiResponce(200, video, "Video updated successfully")
    )


})

const deleteVideo = asynchandeler(async (req, res) => {
    const { videoId } = req.params
    // delete video
    const video = await Video.findOneAndDelete({ videoId })

    return res
        .status(200)
        .json(
            new ApiResponce(200, null, "Video deleted successfully")
        )
})

export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
}