"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFixedSalary = exports.updateFixedSalary = exports.getFixedSalary = exports.createFixedSalary = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fixedSalary_model_1 = require("../models/fixedSalary.model");
const createFixedSalary = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    try {
        if (!payload.companyId) {
            throw new Error("companyId is required");
        }
        // Check if fixed salary already exists for this company
        const existing = yield fixedSalary_model_1.FixedSalaryModel.findOne({ companyId: payload.companyId });
        if (existing) {
            throw new Error("Fixed salary configuration already exists for this company");
        }
        let created = null;
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            created = yield fixedSalary_model_1.FixedSalaryModel.create([payload], { session });
        }));
        return (_a = created === null || created === void 0 ? void 0 : created[0]) !== null && _a !== void 0 ? _a : null;
    }
    finally {
        session.endSession();
    }
});
exports.createFixedSalary = createFixedSalary;
const getFixedSalary = (companyId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!companyId) {
        throw new Error("companyId is required");
    }
    return yield fixedSalary_model_1.FixedSalaryModel.findOne({ companyId }).lean();
});
exports.getFixedSalary = getFixedSalary;
const updateFixedSalary = (id, changes) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        let updated = null;
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            // Ensure companyId is not being changed
            const { companyId } = changes, updateChanges = __rest(changes, ["companyId"]);
            updated = yield fixedSalary_model_1.FixedSalaryModel.findByIdAndUpdate(id, updateChanges, { new: true, session });
        }));
        return updated;
    }
    finally {
        session.endSession();
    }
});
exports.updateFixedSalary = updateFixedSalary;
const deleteFixedSalary = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        let result = null;
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            result = yield fixedSalary_model_1.FixedSalaryModel.findByIdAndDelete(id, { session });
        }));
        return result;
    }
    finally {
        session.endSession();
    }
});
exports.deleteFixedSalary = deleteFixedSalary;
