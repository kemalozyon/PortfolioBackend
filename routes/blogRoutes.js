import express from "express"
import { createBlog, getBlogs} from "../controllers/blogContollers.js"
const router = express.Router()

router.post("/", createBlog)

router.get("/", getBlogs)

export default router