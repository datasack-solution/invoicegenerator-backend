import { Request, Response } from "express";
import {
  createEmployeeConfig,
  updateEmployeeConfig,
  recreateEmployeeConfig,
  getByIqama,
  getAllLatest,
  getById,
  deleteLatestByIqama
} from "../services/employeeConfig.service";

export const createEmployeeConfigController = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const created = await createEmployeeConfig(payload);
    return res.status(201).json({ message: "Created", data: created });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const updateEmployeeConfigController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const changes = req.body;
    const updated = await updateEmployeeConfig(id, changes);
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ message: "Updated", data: updated });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const recreateEmployeeConfigController = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const created = await recreateEmployeeConfig(payload);
    return res.status(201).json({ message: "Recreated", data: created });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const getEmployeeByIqamaController = async (req: Request, res: Response) => {
  try {
    const { iqamaNo } = req.params;
    const data = await getByIqama(iqamaNo);
    return res.status(200).json({ data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const getAllEmployeesController = async (req: Request, res: Response) => {
  try {
    const data = await getAllLatest();
    return res.status(200).json({ data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const getEmployeeByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await getById(id);
    if (!data) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const deleteLatestByIqamaController = async (req: Request, res: Response) => {
  try {
    const { iqamaNo } = req.params;
    const result = await deleteLatestByIqama(iqamaNo);
    return res.status(200).json({ message: "Deleted latest config", result });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};
