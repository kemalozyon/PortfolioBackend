import express from "express"
import { loginAdmin } from "../controllers/authController.js";
const router = express.Router()


router.post("/login", loginAdmin)
// router.post("/register", registerAdmin)


export default router;