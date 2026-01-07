import mongoose from "mongoose";
import { FixedSalaryModel, FixedSalaryDetails } from "../models/fixedSalary.model";

export const createFixedSalary = async (payload: Omit<FixedSalaryDetails,'_id'>) => {
  const session = await mongoose.startSession();
  try {
    if (!payload.companyId) {
      throw new Error("companyId is required");
    }

    // Check if fixed salary already exists for this company
    const existing = await FixedSalaryModel.findOne({ companyId: payload.companyId });
    if (existing) {
      throw new Error("Fixed salary configuration already exists for this company");
    }

    let created: any = null;
    await session.withTransaction(async () => {
      created = await FixedSalaryModel.create([payload], { session });
    });
    return created?.[0] ?? null;
  } finally {
    session.endSession();
  }
};

export const getFixedSalary = async (companyId: string) => {
  if (!companyId) {
    throw new Error("companyId is required");
  }
  return await FixedSalaryModel.findOne({ companyId }).lean();
};

export const updateFixedSalary = async (id: string, changes: Partial<FixedSalaryDetails>) => {
  const session = await mongoose.startSession();
  try {
    let updated: any = null;
    await session.withTransaction(async () => {
      // Ensure companyId is not being changed
      const { companyId, ...updateChanges } = changes;
      updated = await FixedSalaryModel.findByIdAndUpdate(id, updateChanges, { new: true, session });
    });
    return updated;
  } finally {
    session.endSession();
  }
};

export const deleteFixedSalary = async (id: string) => {
  const session = await mongoose.startSession();
  try {
    let result: any = null;
    await session.withTransaction(async () => {
      result = await FixedSalaryModel.findByIdAndDelete(id, { session });
    });
    return result;
  } finally {
    session.endSession();
  }
};
