// upload.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Ensure uploads folder exists in backend root
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });

// POST /upload (single file field: "file")
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  // return path relative to server root so frontend can fetch: e.g. "uploads/12345.png"
  res.json({ filePath: req.file.path });
});

module.exports = router;