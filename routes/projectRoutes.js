import express from "express"
import { getProjects, postProject, updateProject, deleteProject} from "../controllers/projectControllers.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getProjects)
router.post("/", protect, postProject)
router.put("/:id", protect, updateProject)
router.delete("/:id", protect, deleteProject)

export default router;