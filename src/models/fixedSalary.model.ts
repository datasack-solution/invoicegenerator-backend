import { Document, model, Model, Schema } from "mongoose";
import { isProduction } from "../utils/db";

// Matches the FixedSalaryDetails interface exactly
export interface FixedSalaryDetails {
    _id?: string;
    companyId: string;
    medicalInsurance: number;
    iqamaRenewalCost: number;
    gosi: number;
    fix: number;
    saudization: number;
    serviceCharge: number; 
    exitFee: number; // optional
    exitReentryFee: number; // optional
}

export interface FixedSalaryDocument extends FixedSalaryDetails { }

const FixedSalarySchema = new Schema<FixedSalaryDocument>(
    {
        companyId: { type: String, required: true, unique: true }, // One fixed salary config per company
        medicalInsurance: { type: Number, required: true },
        iqamaRenewalCost: { type: Number, required: true },
        gosi: { type: Number, required: true },
        fix: { type: Number, required: true },
        saudization: { type: Number, required: true },
        serviceCharge: { type: Number, required: true },
        exitFee: { type: Number, required: false },
        exitReentryFee: { type: Number, required: false }
    },
    {
        timestamps: true
    }
);

export const FixedSalaryModel: Model<FixedSalaryDocument> = model<FixedSalaryDocument>(
    isProduction ? "FixedSalary" : "FixedSalaryTest",
    FixedSalarySchema
);

export type FixedSalary = FixedSalaryDetails;
