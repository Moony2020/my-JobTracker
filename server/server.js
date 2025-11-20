const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes - Make sure these are properly mounted
app.use("/api/auth", require("./routes/auth"));
app.use("/api/applications", require("./routes/applications"));

// Serve React app (if you add React later)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});
// أضف هذا قبل السطر الأخير في server.js
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Applications API available at http://localhost:${PORT}/api/applications`
  );
});
