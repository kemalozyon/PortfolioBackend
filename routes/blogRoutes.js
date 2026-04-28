import express from "express"
import { createBlog, getBlogs, updateBlog, deleteBlog, getBlogById} from "../controllers/blogContollers.js"
import { protect } from "../middleware/authMiddleware.js"
const router = express.Router()

router.post("/", protect, createBlog)
router.get("/", getBlogs)
router.get("/:id", getBlogById)
router.put("/:id", protect, updateBlog)
router.delete("/:id", protect, deleteBlog)

export default router