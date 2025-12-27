import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserModel } from "../models/user.model";

dotenv.config();

const MONGOURL = process.env.MONGOURL || "";

export const connectDB = async () => {
  if (!MONGOURL) {
    throw new Error("MONGOURL is not defined in environment variables");
  }

  await mongoose.connect(MONGOURL, {
    // useNewUrlParser and useUnifiedTopology are default in mongoose v6+
  });

  console.log("✅ Connected to MongoDB");

  // Seed initial users if none exist (keeps parity with previous hardcoded users)
  const count = await UserModel.countDocuments();
  if (count === 0) {
    console.log("Seeding initial users...");
    await UserModel.create([
      {
        _id: "1",
        email: "admin@company.com",
        password: "admin123",
        name: "Admin User",
        role: "admin"
      },
      {
        _id: "2",
        email: "user@company.com",
        password: "user123",
        name: "Normal User",
        role: "user"
      }
    ]);
    console.log("Seeding complete");
  }
};
