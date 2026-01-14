import mongoose from "mongoose";
import { EmployeeModel } from "../models/employee.model";
import { FixedSalaryModel } from "../models/fixedSalary.model";

type CreatePayload = any;

// Helpers to normalize dates to UTC day boundaries
const startOfDayUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
const endOfDayUTC = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

export const OPEN_ENDED_DATE = endOfDayUTC(new Date("9999-12-31T00:00:00.000Z"));

// export const createEmployeeConfig = async (payload: CreatePayload) => {
//   const session = await mongoose.startSession();
//   try {
//     let created: any = null;
//     await session.withTransaction(async () => {
//       // Remove _id from payload to avoid conflicts
//       const { _id, ...cleanPayload } = payload;
      
//       const rawFrom = cleanPayload.fromDate ? new Date(cleanPayload.fromDate) : new Date();
//       const fromDate = startOfDayUTC(rawFrom);
//       const toDate = cleanPayload.toDate ? endOfDayUTC(new Date(cleanPayload.toDate)) : OPEN_ENDED_DATE;
//       const joiningDate = cleanPayload.joiningDate ? new Date(cleanPayload.joiningDate) : new Date();
//       const resignationDate = cleanPayload.resignationDate ? new Date(cleanPayload.resignationDate) : undefined;
      
//       cleanPayload.joiningDate = joiningDate;  
//       cleanPayload.resignationDate = resignationDate;  

//       // Always read the single FixedSalary document (first one) and merge its fields
//       const fixed = await FixedSalaryModel.findOne().lean();
//       let finalPayload = cleanPayload;
//       if (fixed) {
//         // Remove _id from fixed salary data
//         const { _id: fixedId, ...fixedData } = fixed;
//         finalPayload = { ...finalPayload, ...fixedData };
//       }

//       // Find previous open-ended config for same iqamaNo and close it FIRST to avoid unique index conflict
//       const prev = await EmployeeModel.findOne({ iqamaNo: finalPayload.iqamaNo, toDate: OPEN_ENDED_DATE }).session(session);
//       if (prev) {
//         const prevTo = new Date(fromDate);
//         // subtract one day in UTC
//         prevTo.setUTCDate(prevTo.getUTCDate() - 1);
//         prev.toDate = endOfDayUTC(prevTo);
//         await prev.save({ session });
//       }

//       // create new config document; let Mongoose assign _id (avoid duplicate _id errors)
//       created = await EmployeeModel.create([
//         {
//           iqamaNo: finalPayload.iqamaNo,
//           name: finalPayload.name,
//           designation: finalPayload.designation,
//           status: finalPayload.status,
//           basic: finalPayload.basic,
//           housing: finalPayload.housing,
//           transport: finalPayload.transport,
//           medicalInsurance: finalPayload.medicalInsurance,
//           iqamaRenewalCost: finalPayload.iqamaRenewalCost,
//           gosi: finalPayload.gosi,
//           fix: finalPayload.fix,
//           saudization: finalPayload.saudization,
//           serviceCharge: finalPayload.serviceCharge,
//           exitFee: finalPayload.exitFee,
//           exitReentryFee: finalPayload.exitReentryFee,
//           fromDate,
//           toDate,
//           joiningDate,
//           resignationDate
//         }
//       ], { session });
//     });

//     return created?.[0] ?? null;
//   } finally {
//     session.endSession();
//   }
// };


export const createEmployeeConfig = async (payload: CreatePayload & {
  companyId: string;
  useDefaultFixedSalary?: boolean;
}) => {
  const session = await mongoose.startSession();
  try {
    let created: any = null;

    await session.withTransaction(async () => {
      const { _id, useDefaultFixedSalary, companyId, ...cleanPayload } = payload;

      if (!companyId) {
        throw new Error("companyId is required");
      }

      const rawFrom = cleanPayload.fromDate ? new Date(cleanPayload.fromDate) : new Date();
      const fromDate = startOfDayUTC(rawFrom);
      const toDate = cleanPayload.toDate
        ? endOfDayUTC(new Date(cleanPayload.toDate))
        : OPEN_ENDED_DATE;

      const joiningDate = cleanPayload.joiningDate
        ? new Date(cleanPayload.joiningDate)
        : new Date();

      const resignationDate = cleanPayload.resignationDate
        ? new Date(cleanPayload.resignationDate)
        : undefined;

      cleanPayload.joiningDate = joiningDate;
      cleanPayload.resignationDate = resignationDate;

      let finalPayload = { ...cleanPayload, companyId };

      // ✅ CONDITIONAL FIXED SALARY MERGE
      if (useDefaultFixedSalary) {
        const fixed = await FixedSalaryModel.findOne({ companyId }).lean();
        if (!fixed) {
          throw new Error("Default fixed salary configuration not found for this company");
        }

        const { _id: fixedId, companyId: fixedCompanyId, ...fixedData } = fixed;
        finalPayload = { ...finalPayload, ...fixedData, fix: payload.fix, gosi:payload.gosi };
      }

      // 🔒 Close previous open-ended config for same company + iqamaNo
      const prev = await EmployeeModel.findOne({
        companyId,
        iqamaNo: finalPayload.iqamaNo,
        toDate: OPEN_ENDED_DATE
      }).session(session);

      if (prev) {
        const prevTo = new Date(fromDate);
        prevTo.setUTCDate(prevTo.getUTCDate() - 1);
        prev.toDate = endOfDayUTC(prevTo);
        await prev.save({ session });
      }

      created = await EmployeeModel.create(
        [{
          ...finalPayload,
          fromDate,
          toDate
        }],
        { session }
      );
    });

    return created?.[0] ?? null;
  } finally {
    session.endSession();
  }
};


export const updateEmployeeConfig = async (id: string, changes: any & { companyId?: string }) => {
  const session = await mongoose.startSession();
  try {
    let updated: any = null;
    await session.withTransaction(async () => {
      // Remove _id from changes to avoid immutable field error
      const { _id, ...updateChanges } = changes;
      let finalChanges = updateChanges;

      // Load existing document to compute resulting iqamaNo and toDate
      const existing = await EmployeeModel.findById(id).session(session);
      if (!existing) throw new Error("Config not found");

      const newIqamaNo = finalChanges.iqamaNo ?? existing.iqamaNo;
      const newToDate = finalChanges.toDate ? endOfDayUTC(new Date(finalChanges.toDate)) : endOfDayUTC(new Date(existing.toDate));
      const companyId = existing.companyId; // Use existing companyId

      // Check uniqueness: no other doc should have same companyId + iqamaNo + toDate
      const conflict = await EmployeeModel.findOne({ 
        companyId,
        iqamaNo: newIqamaNo, 
        toDate: newToDate, 
        _id: { $ne: id } 
      }).session(session);
      
      if (conflict) {
        throw new Error("Duplicate config: another entry exists with same iqamaNo and toDate");
      }

      updated = await EmployeeModel.findByIdAndUpdate(id, finalChanges, { new: true, session });
    });
    return updated;
  } finally {
    session.endSession();
  }
};


// export const updateEmployeeConfig = async (
//   id: string,
//   changes: any & { useDefaultFixedSalary?: boolean }
// ) => {
//   const session = await mongoose.startSession();
//   try {
//     let updated: any = null;

//     await session.withTransaction(async () => {
//       const { _id, useDefaultFixedSalary, ...updateChanges } = changes;

//       let finalChanges = updateChanges;

//       if (useDefaultFixedSalary) {
//         const fixed = await FixedSalaryModel.findOne().lean();
//         if (!fixed) {
//           throw new Error("Default fixed salary configuration not found");
//         }

//         const { _id: fixedId, ...fixedData } = fixed;
//         finalChanges = { ...finalChanges, ...fixedData };
//       }

//       const existing = await EmployeeModel.findById(id).session(session);
//       if (!existing) throw new Error("Config not found");

//       const newIqamaNo = finalChanges.iqamaNo ?? existing.iqamaNo;
//       const newToDate = finalChanges.toDate
//         ? endOfDayUTC(new Date(finalChanges.toDate))
//         : endOfDayUTC(new Date(existing.toDate));

//       const conflict = await EmployeeModel.findOne({
//         iqamaNo: newIqamaNo,
//         toDate: newToDate,
//         _id: { $ne: id }
//       }).session(session);

//       if (conflict) {
//         throw new Error("Duplicate config: another entry exists with same iqamaNo and toDate");
//       }

//       updated = await EmployeeModel.findByIdAndUpdate(
//         id,
//         finalChanges,
//         { new: true, session }
//       );
//     });

//     return updated;
//   } finally {
//     session.endSession();
//   }
// };


export const recreateEmployeeConfig = async (payload: CreatePayload & { companyId: string }) => {
  // For recreation we force the new config's fromDate to the 1st day of the next month (UTC)
  const baseDate = payload.fromDate ? new Date(payload.fromDate) : new Date();
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  // first day of next month
  const nextMonthFirst = startOfDayUTC(new Date(Date.UTC(year, month + 1, 1)));
  const newPayload = { ...payload, fromDate: nextMonthFirst.toISOString() };
  return createEmployeeConfig(newPayload);
};

// Get all config entries for an iqamaNo in a company (history)
export const getByIqama = async (companyId: string, iqamaNo: string) => {
  return EmployeeModel.find({ companyId, iqamaNo }).sort({ fromDate: -1 }).lean();
};

// Get latest (open-ended) configs for all employees in a company
export const getAllLatest = async (companyId: string) => {
  return EmployeeModel.find({ companyId, toDate: OPEN_ENDED_DATE }).lean();
};

// Get by document id
export const getById = async (id: string) => {
  return EmployeeModel.findById(id).lean();
};

// Delete latest config for iqamaNo in a company and reopen previous (set toDate to OPEN_ENDED_DATE)
export const deleteLatestByIqama = async (companyId: string, iqamaNo: string) => {
  const session = await mongoose.startSession();
  try {
    let result: any = null;
    await session.withTransaction(async () => {
      // Find the latest open-ended config for this company
      const latest = await EmployeeModel.findOne({ companyId, iqamaNo, toDate: OPEN_ENDED_DATE }).session(session);
      if (!latest) {
        throw new Error("No latest config found for iqamaNo in this company");
      }

      // Delete it
      result = await EmployeeModel.findByIdAndDelete(latest._id, { session });

      // Find previous latest by fromDate descending for this company
      const prev = await EmployeeModel.findOne({ companyId, iqamaNo }).sort({ fromDate: -1 }).session(session);
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
