import express from "express"
import { createContact, getContacts, deleteContact } from "../controllers/contactController.js"
import { protect } from "../middleware/authMiddleware.js"
const router = express.Router()

router.post("/", createContact)
router.get("/", protect, getContacts)
router.delete("/:id", protect, deleteContact)

export default router
