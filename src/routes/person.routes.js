import { Router } from "express"
import { getAllPersons, getPerson, createPerson, updatePerson, deletePerson } from "../controllers/person.controller.js"

const router = Router()

router.get("/", getAllPersons)
router.get("/:id", getPerson)
router.post("/", createPerson)
router.put("/:id", updatePerson)
router.delete("/:id", deletePerson)

export default router
