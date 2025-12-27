import { LoginPayload } from "../types/auth.types";
import { UserModel, User } from "../models/user.model";

export const loginService = async (payload: LoginPayload) => {
  // find user by email
  const userDoc = await UserModel.findOne({ email: payload.email }).lean();

  if (!userDoc) return null;

  // NOTE: passwords are stored in plaintext for compatibility with previous seed.
  // In production, hash passwords and use a secure comparison (bcrypt.compare).
  if (userDoc.password !== payload.password) return null;

  const { password, ...safeUser } = userDoc as unknown as User;

  const token = Buffer.from(`${userDoc._id}:${userDoc.email}`).toString("base64");

  return {
    user: safeUser,
    token
  };
};
