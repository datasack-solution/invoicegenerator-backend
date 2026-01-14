import { Request, Response } from "express";
import { createFixedSalary, updateFixedSalary, deleteFixedSalary, getFixedSalary } from "../services/fixedSalary.service";

export const createFixedSalaryController = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const { company } = req.query;
    
    if (!company) {
      return res.status(400).json({ message: "Company parameter is required" });
    }

    const payloadWithCompany = { ...payload, companyId: company };
    const created = await createFixedSalary(payloadWithCompany);
    return res.status(201).json({ message: "Created", data: created });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const getFixedSalaryController = async (req: Request, res: Response) => {
  try {
    const { company } = req.query;
    
    if (!company) {
      return res.status(400).json({ message: "Company parameter is required" });
    }

    const fixedSalary = await getFixedSalary(company as string);
    console.log("fixed salary:",fixedSalary)
    return res.status(200).json({ message: "Retrieved", data: fixedSalary });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const updateFixedSalaryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const changes = req.body;
    const updated = await updateFixedSalary(id, changes);
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ message: "Updated", data: updated });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const deleteFixedSalaryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFixedSalary(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ message: "Deleted" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};
