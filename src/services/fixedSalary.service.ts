import mongoose from "mongoose";
import { FixedSalaryModel, FixedSalaryDetails } from "../models/fixedSalary.model";

export const createFixedSalary = async (payload: FixedSalaryDetails) => {
  const session = await mongoose.startSession();
  try {
    let created: any = null;
    await session.withTransaction(async () => {
      created = await FixedSalaryModel.create([payload], { session });
    });
    return created?.[0] ?? null;
  } finally {
    session.endSession();
  }
};

export const updateFixedSalary = async (id: string, changes: Partial<FixedSalaryDetails>) => {
  const session = await mongoose.startSession();
  try {
    let updated: any = null;
    await session.withTransaction(async () => {
      updated = await FixedSalaryModel.findByIdAndUpdate(id, changes, { new: true, session });
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
