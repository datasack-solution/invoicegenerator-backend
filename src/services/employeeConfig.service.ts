import mongoose from "mongoose";
import { EmployeeModel } from "../models/employee.model";
import { FixedSalaryModel } from "../models/fixedSalary.model";

type CreatePayload = any;

// Helpers to normalize dates to UTC day boundaries
const startOfDayUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
const endOfDayUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

const OPEN_ENDED_DATE = endOfDayUTC(new Date("9999-12-31T00:00:00.000Z"));

export const createEmployeeConfig = async (payload: CreatePayload) => {
  const session = await mongoose.startSession();
  try {
    let created: any = null;
    await session.withTransaction(async () => {
      const rawFrom = payload.fromDate ? new Date(payload.fromDate) : new Date();
      const fromDate = startOfDayUTC(rawFrom);
      const toDate = payload.toDate ? endOfDayUTC(new Date(payload.toDate)) : OPEN_ENDED_DATE;
      const joiningDate = payload.joiningDate ? new Date(payload.joiningDate) : new Date();
      const resignationDate = payload.resignationDate ? new Date(payload.resignationDate) : undefined;
      
      payload.joiningDate = joiningDate;  
      payload.resignationDate = resignationDate;  

      // Always read the single FixedSalary document (first one) and merge its fields
      const fixed = await FixedSalaryModel.findOne().lean();
      if (fixed) {
        payload = { ...payload, ...fixed };
      }

      // Find previous open-ended config for same iqamaNo and close it FIRST to avoid unique index conflict
      const prev = await EmployeeModel.findOne({ iqamaNo: payload.iqamaNo, toDate: OPEN_ENDED_DATE }).session(session);
      if (prev) {
        const prevTo = new Date(fromDate);
        // subtract one day in UTC
        prevTo.setUTCDate(prevTo.getUTCDate() - 1);
        prev.toDate = endOfDayUTC(prevTo);
        await prev.save({ session });
      }

      // create new config document; let Mongoose assign _id (avoid duplicate _id errors)
      created = await EmployeeModel.create([
        {
          iqamaNo: payload.iqamaNo,
          name: payload.name,
          designation: payload.designation,
          status: payload.status,
          basic: payload.basic,
          housing: payload.housing,
          transport: payload.transport,
          medicalInsurance: payload.medicalInsurance,
          iqamaRenewalCost: payload.iqamaRenewalCost,
          gosi: payload.gosi,
          fix: payload.fix,
          saudization: payload.saudization,
          serviceCharge: payload.serviceCharge,
          exitFee: payload.exitFee,
          exitReentryFee: payload.exitReentryFee,
          fromDate,
          toDate,
          joiningDate,
          resignationDate
        }
      ], { session });
    });

    return created?.[0] ?? null;
  } finally {
    session.endSession();
  }
};

export const updateEmployeeConfig = async (id: string, changes: any) => {
  const session = await mongoose.startSession();
  try {
    let updated: any = null;
    await session.withTransaction(async () => {
      // For corrections we also read the single FixedSalary doc and merge (if present)
      const fixedForUpdate = await FixedSalaryModel.findOne().lean();
      if (fixedForUpdate) {
        changes = { ...changes, ...fixedForUpdate };
      }

      // Load existing document to compute resulting iqamaNo and toDate
      const existing = await EmployeeModel.findById(id).session(session);
      if (!existing) throw new Error("Config not found");

      const newIqamaNo = changes.iqamaNo ?? existing.iqamaNo;
      const newToDate = changes.toDate ? endOfDayUTC(new Date(changes.toDate)) : endOfDayUTC(new Date(existing.toDate));

      // Check uniqueness: no other doc should have same iqamaNo + toDate
      const conflict = await EmployeeModel.findOne({ iqamaNo: newIqamaNo, toDate: newToDate, _id: { $ne: id } }).session(session);
      if (conflict) {
        throw new Error("Duplicate config: another entry exists with same iqamaNo and toDate");
      }

      updated = await EmployeeModel.findByIdAndUpdate(id, changes, { new: true, session });
    });
    return updated;
  } finally {
    session.endSession();
  }
};

export const recreateEmployeeConfig = async (payload: CreatePayload) => {
  // For recreation we force the new config's fromDate to the 1st day of the next month (UTC)
  const baseDate = payload.fromDate ? new Date(payload.fromDate) : new Date();
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  // first day of next month
  const nextMonthFirst = startOfDayUTC(new Date(Date.UTC(year, month + 1, 1)));
  const newPayload = { ...payload, fromDate: nextMonthFirst.toISOString() };
  return createEmployeeConfig(newPayload);
};

// Get all config entries for an iqamaNo (history)
export const getByIqama = async (iqamaNo: string) => {
  return EmployeeModel.find({ iqamaNo }).sort({ fromDate: -1 }).lean();
};

// Get latest (open-ended) configs for all employees
export const getAllLatest = async () => {
  return EmployeeModel.find({ toDate: OPEN_ENDED_DATE }).lean();
};

// Get by document id
export const getById = async (id: string) => {
  return EmployeeModel.findById(id).lean();
};

// Delete latest config for iqamaNo and reopen previous (set toDate to OPEN_ENDED_DATE)
export const deleteLatestByIqama = async (iqamaNo: string) => {
  const session = await mongoose.startSession();
  try {
    let result: any = null;
    await session.withTransaction(async () => {
      // Find the latest open-ended config
      const latest = await EmployeeModel.findOne({ iqamaNo, toDate: OPEN_ENDED_DATE }).session(session);
      if (!latest) {
        throw new Error("No latest config found for iqamaNo");
      }

      // Delete it
      result = await EmployeeModel.findByIdAndDelete(latest._id, { session });

      // Find previous latest by fromDate descending
      const prev = await EmployeeModel.findOne({ iqamaNo }).sort({ fromDate: -1 }).session(session);
      if (prev) {
        // Set prev.toDate to open-ended
        prev.toDate = OPEN_ENDED_DATE;
        await prev.save({ session });
      }
    });

    return result;
  } finally {
    session.endSession();
  }
};
