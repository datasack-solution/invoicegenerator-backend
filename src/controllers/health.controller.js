"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const healthCheck = (_req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running 🚀" });
};
exports.healthCheck = healthCheck;
