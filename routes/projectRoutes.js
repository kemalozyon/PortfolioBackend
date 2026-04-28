import express from "express"
import { getProjects, postProject} from "../controllers/projectControllers.js";

const router = express.Router();

router.get("/", getProjects)
router.post("/", postProject)

export default router;