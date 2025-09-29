import { Person } from "../models/Person.js"

export const getAllPersons = async (req, res) => {
  try {
    const data = await Person.findAll()
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getPerson = async (req, res) => {
  try {
    const item = await Person.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Persona no encontrada" })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createPerson = async (req, res) => {
  try {
    const item = await Person.create(req.body)
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updatePerson = async (req, res) => {
  try {
    const item = await Person.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Persona no encontrada" })
    await item.update(req.body)
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deletePerson = async (req, res) => {
  try {
    const item = await Person.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Persona no encontrada" })
    await item.destroy()
    res.json({ message: "Persona eliminada" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
