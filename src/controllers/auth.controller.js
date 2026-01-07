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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = void 0;
const auth_service_1 = require("../services/auth.service");
const loginController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }
        const result = yield (0, auth_service_1.loginService)({ email, password });
        if (!result) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
        return res.status(200).json({
            message: "Login successful",
            user: result.user,
            token: result.token
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error === null || error === void 0 ? void 0 : error.message
        });
    }
});
exports.loginController = loginController;
