import express from "express"
import { getProjects, postProject, updateProject, deleteProject} from "../controllers/projectControllers.js";

const router = express.Router();

router.get("/", getProjects)
router.post("/", postProject)
router.put("/:id", updateProject)
router.delete("/:id", deleteProject)

export default router;