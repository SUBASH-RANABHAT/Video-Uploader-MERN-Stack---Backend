import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async (req,res) => {

    const {fullName, email, username, password}  = req.body // get  user details from frontend / postman

    if(
        [fullName, email, username, password].some((field) =>    //validation - not empty 
        field?.trim() === "")
    ){
        throw new ApiError(400, "Fill all the requirements properly")
    }

    const existedUser = await User.findOne({          //check if user already exist : username, email
        $or: [{ username }, { email }] 
    })
    if(existedUser){
        throw new ApiError(409, "User with username or email already exists")
    }

    const avatartLocalPath = req.files?.avatar[0]?.path;    //check for images, check for avatar 
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatartLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is required")
    }

    const avatar = await uploadOnCloudinary(avatartLocalPath)  //upload them to cloudinary, check avatar too
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    //create user object - create entry in db   
    const user = await User.create({      
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //remove password and refresh token field from response 
    const createdUser = await User.findById(user._id).select("-password -refeshToken");

    //check for user creation 
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //return response 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something Went Wrong while generating refresh and access Token")
    }
}

const LoginUser = asyncHandler(async (req,res) => {
    //req.body -> data
    //username or email match   
    //find the user
    //password check
    //access and referesh token 
    //send cookie
    const {email, username, password} = req.body
    if (!(username || email)){
        throw new ApiError(400, "username or email is required")
    }
    
   const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User doesnot exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")
    
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User Logged In Successfully"
        )
    )
})

const LogoutUser = asyncHandler(async(req, res) => {
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
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
    .json(new ApiResponse(200, {}, "User logged Out"))

})

export {
    registerUser,
    LoginUser,
    LogoutUser
}

