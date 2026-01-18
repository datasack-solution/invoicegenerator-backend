"use strict";
// Company-specific utility functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBlueBinariesEmployee = exports.validateNeosoftEmployee = exports.getCompanyType = exports.isBlueBinariesCompany = exports.isNeosoftCompany = void 0;
const isNeosoftCompany = (companyId) => {
    return (companyId === null || companyId === void 0 ? void 0 : companyId.toLowerCase()) === 'neosoft';
};
exports.isNeosoftCompany = isNeosoftCompany;
const isBlueBinariesCompany = (companyId) => {
    return (companyId === null || companyId === void 0 ? void 0 : companyId.toLowerCase()) === 'bluebinaries';
};
exports.isBlueBinariesCompany = isBlueBinariesCompany;
const getCompanyType = (companyId) => {
    if ((0, exports.isNeosoftCompany)(companyId))
        return 'neosoft';
    if ((0, exports.isBlueBinariesCompany)(companyId))
        return 'bluebinaries';
    return 'unknown';
};
exports.getCompanyType = getCompanyType;
// Validation helpers for company-specific requirements
const validateNeosoftEmployee = (payload) => {
    const errors = [];
    if (!payload.name)
        errors.push("Name is required");
    if (!payload.iqamaNo)
        errors.push("Iqama number is required");
    if (!payload.joiningDate)
        errors.push("Joining date is required");
    if (!payload.fromDate)
        errors.push("From date is required");
    if (!payload.toDate)
        errors.push("To date is required");
    if (payload.serviceCharge === undefined || payload.serviceCharge === null) {
        errors.push("Service charge is required for Neosoft");
    }
    return errors;
};
exports.validateNeosoftEmployee = validateNeosoftEmployee;
const validateBlueBinariesEmployee = (payload) => {
    const errors = [];
    if (!payload.name)
        errors.push("Name is required");
    if (!payload.iqamaNo)
        errors.push("Iqama number is required");
    if (!payload.joiningDate)
        errors.push("Joining date is required");
    if (!payload.fromDate)
        errors.push("From date is required");
    if (!payload.toDate)
        errors.push("To date is required");
    // Required salary fields for BlueBinaries
    if (payload.basic === undefined || payload.basic === null || payload.basic <= 0) {
        errors.push("Basic salary is required and must be positive");
    }
    if (payload.housing === undefined || payload.housing === null || payload.housing < 0) {
        errors.push("Housing allowance is required and must be non-negative");
    }
    if (payload.transport === undefined || payload.transport === null || payload.transport < 0) {
        errors.push("Transport allowance is required and must be non-negative");
    }
    return errors;
};
exports.validateBlueBinariesEmployee = validateBlueBinariesEmployee;
