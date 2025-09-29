import { Router } from "express"
import { getAllAreas, getArea, createArea, updateArea, deleteArea } from "../controllers/area.controller.js"

const router = Router()

router.get("/", getAllAreas)
router.get("/:id", getArea)
router.post("/", createArea)
router.put("/:id", updateArea)
router.delete("/:id", deleteArea)

export default router
