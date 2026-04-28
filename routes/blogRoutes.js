import express from "express"
import { createBlog } from "../controllers/blogContollers.js"
const router = express.Router()

router.post("/", createBlog)

export default router