import { Schema, model, Model } from "mongoose";

// Attendance common for both companies
export interface Attendance {
    _id?: string;
    iqamaNo: string;
    name: string;
    monthYear: string; // "MM-YYYY"
    totalWorkingDays: number;
    daysPresent: number; // opional
    remarks?: string;
}

export interface AttendanceDocument extends Attendance {}

const AttendanceSchema = new Schema<AttendanceDocument>({
  _id: { type: String, required: false },
  iqamaNo: { type: String, required: true },
  name: { type: String, required: true },
  monthYear: { type: String, required: true },
  totalWorkingDays: { type: Number, required: true },
  daysPresent: { type: Number, required: true },
  remarks: { type: String }
}, { _id: false });

export const AttendanceModel: Model<AttendanceDocument> = model<AttendanceDocument>("Attendance", AttendanceSchema);

export type AttendanceModelType = AttendanceDocument;
