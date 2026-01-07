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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginService = void 0;
const user_model_1 = require("../models/user.model");
const loginService = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // find user by email
    const userDoc = yield user_model_1.UserModel.findOne({ email: payload.email }).lean();
    if (!userDoc)
        return null;
    // NOTE: passwords are stored in plaintext for compatibility with previous seed.
    // In production, hash passwords and use a secure comparison (bcrypt.compare).
    if (userDoc.password !== payload.password)
        return null;
    const _a = userDoc, { password } = _a, safeUser = __rest(_a, ["password"]);
    const token = Buffer.from(`${userDoc._id}:${userDoc.email}`).toString("base64");
    return {
        user: safeUser,
        token
    };
});
exports.loginService = loginService;
