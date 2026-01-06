import { Schema, model, Model } from "mongoose";
import { Attendance, AttendanceSchema } from "./attendance.model";

/* ---------- Dynamic Component ---------- */

export interface InvoiceComponent {
    key: string;               // "service_fee", "bonus"
    label: string;             // "Service Fee", "Performance Bonus"
    type: "earning" | "deduction";
    amount: number;
}

/* ---------- Invoice ---------- */

export interface Invoice {
    invoiceNo: string;

    iqamaNo: string;
    employeeName: string;
    designation?: string;

    //   month?: number;             // 1–12
    //   year?: number;              // 2026
    monthYear: string;
    attendance: Attendance
    version: number;           // 1, 2, 3...
    isFinal: boolean;           // locked or editable

    generatedInMonth?: number;  // actual generation month
    generatedInYear?: number;

    periodStart?: Date;
    periodEnd?: Date;

    baseSalary: {
        basic: number;
        housing: number;
        transport: number;
    };

    fixedCosts: {
        medicalInsurance: number;
        iqamaRenewalCost: number;
        gosi: number;
        fix: number;
        saudization: number;
        serviceCharge: number;
        exitFee?: number;
        exitReentryFee?: number;
    };

    extraComponents: InvoiceComponent[]; // 🔥 dynamic

    grossEarnings: number;
    totalDeductions: number;
    netPayable: number;

    remarks?: string;          // Optional remarks field

    generatedAt: Date;
    replaceAt?: Date;
    finalizedAt?: Date;  // When the invoice was marked as final
    updatedAt?:Date;
    createdAt?:Date
}

/* ---------- Schema ---------- */

const InvoiceSchema = new Schema<Invoice>(
    {
        invoiceNo: { type: String, required: true, unique: true },

        iqamaNo: { type: String, required: true },
        employeeName: { type: String, required: true },
        designation: String,
        monthYear: { type: String, required: true },
        attendance: AttendanceSchema,

        // month: { type: Number, required: false },
        // year: { type: Number, required: false },

        version: { type: Number, required: true },
        isFinal: { type: Boolean, default: false },

        generatedInMonth: { type: Number, required: false },
        generatedInYear: { type: Number, required: false },

        periodStart: { type: Date, required: false },
        periodEnd: { type: Date, required: false },

        baseSalary: {
            basic: Number,
            housing: Number,
            transport: Number
        },

        fixedCosts: {
            medicalInsurance: Number,
            iqamaRenewalCost: Number,
            gosi: Number,
            fix: Number,
            saudization: Number,
            serviceCharge: Number,
            exitFee: Number,
            exitReentryFee: Number
        },

        extraComponents: [
            {
                key: String,
                label: String,
                type: { type: String, enum: ["earning", "deduction"] },
                amount: Number
            }
        ],

        grossEarnings: Number,
        totalDeductions: Number,
        netPayable: Number,

        remarks: { type: String, required: false }, // Optional remarks field

        generatedAt: { type: Date, default: Date.now },
        replaceAt: { type: Date, required: false, default: Date.now },
        finalizedAt: { type: Date, required: false }  // When invoice was marked as final
    },
    { timestamps: true }
);

/* ---------- Index ---------- */

// Group invoices by employee + month
InvoiceSchema.index(
    { iqamaNo: 1, monthYear: 1, version: 1 },
    { unique: true }
);

export const InvoiceModel: Model<Invoice> = model("Invoice", InvoiceSchema);
