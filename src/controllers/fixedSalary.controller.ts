import { Request, Response } from "express";
import { createFixedSalary, updateFixedSalary, deleteFixedSalary, getFixedSalary } from "../services/fixedSalary.service";

export const createFixedSalaryController = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const created = await createFixedSalary(payload);
    return res.status(201).json({ message: "Created", data: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getFixedSalaryController = async (req: Request, res: Response) => {
  try {
    const fixedSalary = await getFixedSalary();
    return res.status(201).json({ message: "Retrieved", data: fixedSalary });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateFixedSalaryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const changes = req.body;
    const updated = await updateFixedSalary(id, changes);
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ message: "Updated", data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteFixedSalaryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFixedSalary(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
