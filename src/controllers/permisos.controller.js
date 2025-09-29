import { Permisos } from "../models/Permisos.js"

export const getAllPermisos = async (req, res) => {
  try {
    const data = await Permisos.findAll()
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getPermiso = async (req, res) => {
  try {
    const item = await Permisos.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Permiso no encontrado" })
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createPermiso = async (req, res) => {
  try {
    const item = await Permisos.create(req.body)
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updatePermiso = async (req, res) => {
  try {
    const item = await Permisos.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Permiso no encontrado" })
    await item.update(req.body)
    res.json(item)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deletePermiso = async (req, res) => {
  try {
    const item = await Permisos.findByPk(req.params.id)
    if (!item) return res.status(404).json({ message: "Permiso no encontrado" })
    await item.destroy()
    res.json({ message: "Permiso eliminado" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
