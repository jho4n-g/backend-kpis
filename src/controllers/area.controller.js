import { Area } from "../models/Area.js"

export const getAllAreas = async (req, res) => {
  try {
    const data = await Area.findAll()
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getArea = async (req, res) => {
  try {
    const item = await Area.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Área no encontrada" })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createArea = async (req, res) => {
  try {
    const item = await Area.create(req.body)
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateArea = async (req, res) => {
  try {
    const item = await Area.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Área no encontrada" })
    await item.update(req.body)
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteArea = async (req, res) => {
  try {
    const item = await Area.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Área no encontrada" })
    await item.destroy()
    res.json({ message: "Área eliminada" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
