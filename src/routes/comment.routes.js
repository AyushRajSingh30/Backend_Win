import { Router } from 'express';
import {
    addComment,
    deleteComment,
    updateComment,
} from "../controllers/comment.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").post(verifyJWT, addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router