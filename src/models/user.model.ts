import { Document, model, Model, Schema } from "mongoose";

export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
}

export interface IUserDocument extends IUser {}

const UserSchema = new Schema<IUserDocument>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "user"] }
  },
  { timestamps: true }
);

export const UserModel: Model<IUserDocument> = model<IUserDocument>(
  "User",
  UserSchema
);

export type User = IUser;
