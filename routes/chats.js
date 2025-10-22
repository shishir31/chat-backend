const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const authMiddleware = require("../middleware/authMiddleware");

// POST create or get 1-on-1 chat
router.post("/", authMiddleware, async (req, res) => {
  const { userId: otherUserId } = req.body;
  if (!otherUserId) return res.status(400).json({ error: "userId is required" });

  try {
    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [req.user.id, otherUserId] }
    }).populate("participants", "username email");

    if (!chat) {
      const newChat = await Chat.create({ participants: [req.user.id, otherUserId] });
      chat = await Chat.findById(newChat._id).populate("participants", "username email");
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all chats of user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: { $in: [req.user.id] } })
      .populate("participants", "username email")
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;