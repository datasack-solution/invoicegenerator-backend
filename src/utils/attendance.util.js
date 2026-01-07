"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProrationRatio = void 0;
const calculateProrationRatio = (totalWorkingDays, daysPresent) => {
    if (totalWorkingDays <= 0) {
        throw new Error("Invalid totalWorkingDays in attendance");
    }
    if (daysPresent < 0 || daysPresent > totalWorkingDays) {
        throw new Error("Invalid daysPresent in attendance");
    }
    return Number((daysPresent / totalWorkingDays).toFixed(4));
};
exports.calculateProrationRatio = calculateProrationRatio;
