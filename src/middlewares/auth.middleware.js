"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
    // TEMP: decode fake token
    try {
        const decoded = Buffer.from(token, "base64")
            .toString("utf-8");
        const [id, email] = decoded.split(":");
        if (!id || !email) {
            throw new Error();
        }
        next();
    }
    catch (_a) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
};
exports.authMiddleware = authMiddleware;
