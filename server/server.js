const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["https://jobtracker-ptwj.onrender.com", "http://localhost:3000"],
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
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("TIP: Check if your MONGO_URI includes the database name (e.g., ...mongodb.net/jobtracker?...) and if your IP is whitelisted in MongoDB Atlas.");
  });

// Routes - Make sure these are properly mounted
app.use("/api/auth", require("./routes/auth"));
app.use("/api/applications", require("./routes/applications"));

// Serve React app (if you add React later)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend: https://jobtracker-ptwj.onrender.com`);
  console.log(`API: https://jobtracker-ptwj.onrender.com/api`);
});
