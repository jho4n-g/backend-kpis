import { Router } from "express"
import { getAllPermisos, getPermiso, createPermiso, updatePermiso, deletePermiso } from "../controllers/permisos.controller.js"

const router = Router()

router.get("/", getAllPermisos)
router.get("/:id", getPermiso)
router.post("/", createPermiso)
router.put("/:id", updatePermiso)
router.delete("/:id", deletePermiso)

export default router
