import express from "express"
import { createBlog, getBlogs, updateBlog, deleteBlog} from "../controllers/blogContollers.js"
import { protect } from "../middleware/authMiddleware.js"
const router = express.Router()

router.post("/", protect, createBlog)
router.get("/", getBlogs)
router.put("/:id", protect, updateBlog)
router.delete("/:id", protect, deleteBlog)

export default router