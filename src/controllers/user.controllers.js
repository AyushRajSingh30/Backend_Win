import { asynchandeler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.module.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponce } from "../utils/ApiResponce.js";

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



export { registerUser, loginUser, logoutUser }