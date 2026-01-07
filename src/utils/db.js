"use strict";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import { UserModel } from "../models/user.model";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDBwithRetry = exports.isProduction = void 0;
exports.isProduction = process.env.NODE_ENV === 'production';
// dotenv.config();
// const MONGOURL = process.env.MONGOURL || "";
// export const connectDB = async () => {
//   if (!MONGOURL) {
//     throw new Error("MONGOURL is not defined in environment variables");
//   }
//   await mongoose.connect(MONGOURL, {
//     // useNewUrlParser and useUnifiedTopology are default in mongoose v6+
//   });
//   console.log("✅ Connected to MongoDB");
//   // Seed initial users if none exist (keeps parity with previous hardcoded users)
//   const count = await UserModel.countDocuments();
//   if (count === 0) {
//     console.log("Seeding initial users...");
//     await UserModel.create([
//       {
//         _id: "1",
//         email: "admin@company.com",
//         password: "admin123",
//         name: "Admin User",
//         role: "admin"
//       },
//       {
//         _id: "2",
//         email: "user@company.com",
//         password: "user123",
//         name: "Normal User",
//         role: "user"
//       }
//     ]);
//     console.log("Seeding complete");
//   }
// };
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const server_1 = require("../server");
dotenv_1.default.config();
const connectDBwithRetry = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGOURL);
        if (!(0, server_1.checkIsServerStarted)()) {
            (0, server_1.startServer)();
        }
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        setTimeout(exports.connectDBwithRetry, 5000);
    }
});
exports.connectDBwithRetry = connectDBwithRetry;
//handling mongoose connection error
mongoose_1.default.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});
//try to connect with db once it gets disconnected
mongoose_1.default.connection.on('disconnected', () => {
    console.log('Lost MongoDB connection. Attempting to reconnect...');
    (0, exports.connectDBwithRetry)();
});
(0, exports.connectDBwithRetry)();
exports.default = exports.connectDBwithRetry;
