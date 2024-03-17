import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponce } from "../utils/ApiResponce.js"
import { asynchandeler } from "../utils/asyncHandeler.js"


const addComment = asynchandeler(async (req, res) => {
    //  add a comment to a video
    const { content } = req.body
    const { videoId } = req.params

    if (!content && !videoId) {
        throw new ApiError(400, "content is required")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id,

    });

    if (!comment) {
        throw new ApiError(500, "Somthing is Wrong")
    }

    return res
        .status(201)
        .json(new ApiResponce(201, comment, "comment added to video!"));
})

const updateComment = asynchandeler(async (req, res) => {
    // update a comment
    const { commentId } = req.params
    const { content } = req.body

    if (!commentId && !content) {
        throw new ApiError(400, "content is required")
    }

    const commentupdate = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content: content,
            },
        },
        { new: true, }
    )

    if (!commentupdate) {
        throw new ApiError(500, "Somthing Is Wrong")
    }

    return res
        .status(200)
        .json(new ApiResponce(200, commentupdate, "Comment Updated Successfully!"))

})

const deleteComment = asynchandeler(async (req, res) => {
    // delete a comment

    const { commentId } = req.params;

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(500, "Error while deleting comment!");
    }

    return res
        .status(200)
        .json(new ApiResponce(200, null, "comment deleted successfully!"));

})

export {
    addComment,
    updateComment,
    deleteComment
}