import { model, Model, Schema } from "mongoose";
import { Attendance } from "./attendance.model";
import { EmployeeConfig } from "./employee.model";

export interface Invoice extends EmployeeConfig, Attendance{
        InvoiceID: string; //"INV-JAN-2025-EMP-1-01"
        remarks: string;
}

export interface InvoiceDocument extends Invoice {}

// Build schema fields exactly matching Employee + Attendance + InvoiceID + remarks
const InvoiceSchema = new Schema<InvoiceDocument>({
    _id: { type: String, required: true },
    // Employee fields
    iqamaNo: { type: String, required: true },
    name: { type: String, required: true },
    designation: { type: String },
    status: { type: String, required: true, enum: ["active", "inactive"] },
    basic: { type: Number, required: true },
    housing: { type: Number, required: true },
    transport: { type: Number, required: true },
    // Attendance fields
    monthYear: { type: String, required: true },
    totalWorkingDays: { type: Number, required: true },
    daysPresent: { type: Number, required: true },
    remarks: { type: String, required: false },
    // Invoice-specific
    InvoiceID: { type: String, required: true }
}, { _id: false, timestamps: true });

export const InvoiceModel: Model<InvoiceDocument> = model<InvoiceDocument>("Invoice", InvoiceSchema);

export type InvoiceModelType = InvoiceDocument;