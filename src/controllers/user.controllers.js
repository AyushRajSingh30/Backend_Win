import { asynchandeler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.module.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponce } from "../utils/ApiResponce.js";


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

    //6. creat user and entry in db
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



export { registerUser }