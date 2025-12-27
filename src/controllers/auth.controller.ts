import { Request, Response } from "express";
import { loginService } from "../services/auth.service";

export const loginController = async (
    req: Request,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await loginService({ email, password });

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

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
