"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("../utils/db");
const UserSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "user"] }
}, { timestamps: true });
exports.UserModel = (0, mongoose_1.model)(db_1.isProduction ? "User" : "UserTest", UserSchema);
