import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {

    cb(null, file.originalname)
  }
})

export const upload = multer({
  storage
})


//The multer configuration in your code indicates that when a file is uploaded by a user, it will be stored on the local server in the specified directory. In your case, the destination is set to "./public/temp", so the uploaded files will be saved in the "temp" directory within the "public" directory on your server
