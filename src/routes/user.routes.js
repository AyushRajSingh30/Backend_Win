import { Router } from "express"
import { registerUser,loginUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
const router = Router();

router.route("/register").post(
    upload.fields([  //upload.fields is provide by multer
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }

    ]),
    registerUser)

    router.route("/login").post(loginUser)



export default router