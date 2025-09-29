import { Rol } from "../models/Rol.js"

export const getAllRoles = async (req, res) => {
  try {
    const data = await Rol.findAll()
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getRol = async (req, res) => {
  try {
    const item = await Rol.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Rol no encontrado" })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createRol = async (req, res) => {
  try {
    const item = await Rol.create(req.body)
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateRol = async (req, res) => {
  try {
    const item = await Rol.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Rol no encontrado" })
    await item.update(req.body)
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteRol = async (req, res) => {
  try {
    const item = await Rol.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Rol no encontrado" })
    await item.destroy()
    res.json({ message: "Rol eliminado" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
