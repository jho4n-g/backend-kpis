import { Seccion } from "../models/Seccion.js"

export const getAllSecciones = async (req, res) => {
  try {
    const data = await Seccion.findAll()
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getSeccion = async (req, res) => {
  try {
    const item = await Seccion.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Sección no encontrada" })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createSeccion = async (req, res) => {
  try {
    const item = await Seccion.create(req.body)
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateSeccion = async (req, res) => {
  try {
    const item = await Seccion.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Sección no encontrada" })
    await item.update(req.body)
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteSeccion = async (req, res) => {
  try {
    const item = await Seccion.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Sección no encontrada" })
    await item.destroy()
    res.json({ message: "Sección eliminada" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
