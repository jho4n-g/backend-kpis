import { Router } from "express"
import { getAllRoles, getRol, createRol, updateRol, deleteRol } from "../controllers/rol.controller.js"

const router = Router()

router.get("/", getAllRoles)
router.get("/:id", getRol)
router.post("/", createRol)
router.put("/:id", updateRol)
router.delete("/:id", deleteRol)

export default router
