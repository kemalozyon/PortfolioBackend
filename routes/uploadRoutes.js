import express from "express"
import upload from "../config/cloudinary.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/", protect, upload.single("image"), (req , res) => {
    if(!req.file){
        return res.status(404).json({message: "Please upload an image"})
    }

    res.status(200).json({
        url : req.file.path
    })
})

export default router;