import dotenv from "dotenv";
import app from "./app";
import routes from './routes'

dotenv.config();

const PORT = process.env.PORT || 5000;

import { connectDB } from "./utils/db";

app.use("/api", routes);

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
