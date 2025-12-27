import { Document, model, Model, Schema } from "mongoose";

// Matches the FixedSalaryDetails interface exactly
export interface FixedSalaryDetails {
    medicalInsurance: number;
    iqamaRenewalCost: number;
    gosi: number;
    fix: number;
    saudization: number;
    serviceCharge: number; // datasack service charge
    exitFee: number; // optional
    exitReentryFee: number; // optional
}

export interface FixedSalaryDocument extends FixedSalaryDetails, Document { }

const FixedSalarySchema = new Schema<FixedSalaryDocument>(
    {
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
    "FixedSalary",
    FixedSalarySchema
);

export type FixedSalary = FixedSalaryDetails;
