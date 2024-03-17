import { asynchandeler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.module.js"

export const verifyJWT = asynchandeler(async (req, res, next) => {
    try {
        //1.find token from req.cookies
        //2.verify token is valid or not
        //3.find user by id
        //4.insert user in req.user

        //1.
        //req.header is a method to access accessToken like Authorization: Bearer <token>
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log(token);

        if (!token) {
            throw new ApiError(401, "Unauthorized request AccessToken")
        }

        //2.
        //provide key(ACCESS_TOKEN_SECRET) to jws for access data of jwt like id, email etc.
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        //3.
        //In user have all jwt value like id  etc.
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            //discus about frontend
            throw new ApiError(401, "invalid Access Token")
        }
        //4.
        //hear we add user method in req like method in object

        req.user = user;
        next()
    } catch (error) {

        throw new ApiError(401, error?.message || "Invalid")
    }

})