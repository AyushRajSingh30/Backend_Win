import { asynchandeler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.module.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken";
import { response } from "express";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const AccessToken1 = user.generateAccessToken();
        const RefreshToken1 = user.generateRefreshToken();

        let accessToken;
        let refreshToken;

        //Accesstoken1 And RefreshToken1 value come in promise we converd value in string by using try catch method...
        async function getValueFromAccessToken1Promise() {
            try {
                accessToken = await AccessToken1;   // resolved value of the promise
            } catch (error) {
                throw new ApiError(500, "Somthing Wrong while generated access token")
            }
        }
        getValueFromAccessToken1Promise();

        async function getValueFromRefreshToken1Promise() {
            try {
                refreshToken = await RefreshToken1;
                user.refreshToken = refreshToken;        // Set refreshToken value in the user object
            } catch (error) {
                throw new ApiError(500, "Somthing Wrong while generated refresh token")
            }
        }
        getValueFromRefreshToken1Promise()
        // Save the user object to the database
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Somthing Wrong while generated refress and access token")
    }
}

const registerUser = asynchandeler(async (req, res) => {
    /*  // 1. get user detail from frontend
   //2. validation - not empty
   //3. cheak if user is already exists:username or email
   //4. cheak for images, cheak for avatar
   //5. upload them to cloudinary, avatar
   //6. creat user object - create entry in db
   //7.remove password and refrese token field from response
   //8. cheak for user creation 
   //9. return responce   */

    // 1. take detail for body and destructure
    const { fullName, email, username, password } = req.body;
    console.log("email:", email);

    /* //first method o cheak validation do also for all fullName, email etc
 if(fullName==""){
  throw new ApiError(400,"fullname is required")
 }    */

    //2. Second Method for cheak validation by using Some method it give true or false values

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All field are required")
    }

    //3. cheak user exist or not find and findone both are all most same 
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // If req.files is available and not null or undefined, it proceeds to access the avatar property of req.files. Then, it accesses the first element [0] of the avatar req.files given by multter

    //4. avatarLocalPath store multer path of avatar and req.files provide by multter
    // we not give avatar in body error show: Cannot read properties of undefined
    const avatarLocalPath = req.files?.avatar[0].path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //5. Uplode on cloudinary server
    // console.log(`avatarLocalPath:=>${avatarLocalPath}`);
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    console.log(`avatar:=>${avatar}`);
    console.log(`coverImage:=>${coverImage}`);


    //avatar requred true remove due to cloudnary not accept my file i true aagain in future

    // if (!avatar) {
    //     throw new ApiError(400, "400 Avatar file is required")
    // }

    //6. creat user and entry in db create make collection in database in mongoose
    const user = await User.create({
        fullName,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),

    })

    // 7. cheak user is avilable if avilable than apply select method and write which value you not want

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //8.
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while request the user")
    }

    //9.
    return res.status(201).json(
        new ApiResponce(200, createdUser, "User resisterd Successfully")
    )


})

const loginUser = asynchandeler(async (req, res) => {

    //1. req body -> data
    //2. username or email
    //3. find the user
    //4. password cheak  by bcrypt method
    //5. access and refresh token and sent to user
    //6. sent token through cookies

    //1.
    const { email, username, password } = req.body;
    console.log(email);
    //2.
    if (!username && !email) {
        throw new ApiError(400, "username or password is required");
    }
    //3.
    //findOne mongosdb method and $or dono me se koi bhi phle mile uski value le lo
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "User does not exixts")
    }
    //User is used for apply mongodb method but user is used for you one make method 

    //4.

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // cookies
    // httpOnly and Secure by using this no one modify cookies on frontend cookies only modify  by backend
    //because by default cookies also modify by frontend
    const options = {
        httpOnly: true,
        secure: true
    }

    //Add cookies and responce
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponce(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                }, "User logged in Successfully")
        )

})

const logoutUser = asynchandeler(async (req, res) => {
    //remove cookies and refresh tokens
    User.findByIdAndUpdate(
        // req.user.id is quary for find user
        req.user._id, {
        $unset: {
            refreshToken: 1 //this remove the field from documents
        }
    },
        {
            new: true                                    //all new value only come 
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponce(200, {}, "User logged Out"))
})

/* hit this end point and refresh the access token and refresh token also
callled session storage session storage is also similar like refresh token*/

const refreshAccessToken = asynchandeler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expire and not valid")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponce(200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token refreshed Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }



})

const changeCurrentPassword = asynchandeler(async (req, res) => {
    //1.what data required from user
    //2.thake user detail by using middleware
    //3.chake old password is correct or not
    //4.set new password
    //5. save password

    //take data from user
    const { oldPassword, newPassword } = req.body
    //2.
    const user = await User.findById(req.user?._id)
    //3.
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    //4.
    user.password = newPassword
    //5.
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponce(200, {}, "Password change Successfully"))
})

const getCurrentUser = asynchandeler(async (req, res) => {
    //end point already pass through middleware and get all data

    return res
        .status(200)
        .json(new ApiResponce(200, req.user, "Current user fetched Successfully"))


})
const updateAccountDetails = asynchandeler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },

        { new: true }

    ).select("-password")

    return res.status(200)
        .json(new ApiResponce(200, user, "Account details update Successfully"))
})

const updateUserAvatar = asynchandeler(async (req, res) => {
    //req.file method givel multter midleware for one file
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar fileis missing")
    }
    //TODO: old avatar image
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true } //only accept new value
    ).select("-password")

    return res.status(200)
        .json(
            ApiResponce(
                200,
                user,
                "Avatar Are Updated Successfully",
            )
        )

})
const updateUserCoverImage = asynchandeler(async (req, res) => {
    //req.file method givel multter midleware for one file
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage fileis missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true } //only accept new value
    ).select("-password")

    return res.status(200)
        .json(
            ApiResponce(
                200,
                user,
                "CoverImage Are Updated Successfully",
            )
        )

})

//agression pipeline
const getUserChannelProfile = asynchandeler(async (req, res) => {
    //find username fro url we used req.params
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(40, "username is Missing")
    }

    //Aggregate data directly go to mongodb not pass throw mongosse to mongodb
    const channel = await User.aggregate([
        {
            //match user by username  we write field in aggregate we used $ sing
            $match: {
                username: username?.toLowerCase()
            }
        }
        ,
        {
            //cheak Suscribers of you channel lookup is used for joint collection 
            $lookup: {
                from: "subscriptions", //db name of Subscription ye kis ke sath joint karna hai
                localField: "_id",
                foreignField: "channel",
                as: "subscripers"
            }
        },
        {
            //cheak how much channel you subscribed to 
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        }
        ,
        {
            /*$addFields add new fields in user object database existing fields are already avilable
             Ex User have username , email etc ... by used $addFields we add new fields like subscriberscount
              and channelsSubscribedToCount  in User object... this mthod also converd array data into object form*/

            $addFields: {
                subscribersCount: {
                    $size: "$subscribers" //Calculate the size of the arrayField
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"  //Calculate the size of the arrayField
                },

                //subscriber button press or not 

                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "subscribers.subscriber"]
                            , then: true,
                            else: false
                        }
                    }
                }

            }
        },
        {
            //We used $project for which data we want to provide to frontand ... ex give below in this example we not pass password , accesstoken , refreshtoken, etc...
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist");
    }

    //we give in data in form in object
    return res.
        ststus(200)
        .json(
            new ApiResponce(200, channel[0], "User channel fetched Successfully")
        )


})


const getWatchHistory = asynchandeler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                //this is method to pass id throw aggregation pipeline by using mongoose method (new mongoose.Type.ObjectId(req.user._id))

                _id: new mongoose.Type.ObjectId(req.user._id)

            }
        },

        {
            $lookup: {
                from: "videos",
                localField: "WatchHistory",
                foreignField: "_id",
                as: "watchHistory",
                //this pipeline used for nesting or sub pipeline and nesting of videos collection below


                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            //this sub pipline for ownerfield
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        avatar: 1,
                                        username: 1,
                                    }
                                }
                            ]
                        }
                    }, {
                        //we apply this firld to converd array form data into object
                        $addFields: {
                            owner: {
                                $first: "$owner"
                                // The $first operator is used to select the first element of an array
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.
        status(200)
        .json(
            new ApiResponce(
                200,
                user[0].watchHistory,
                "Watch history fetch Successfully"
            )
        )

})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}