const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const authMiddleware = require("../middleware/authMiddleware");

// GET messages of a chat
router.get("/:chatId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username email")
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST send message
router.post("/", authMiddleware, async (req, res) => {
  const { chatId, text, file } = req.body;
  if (!chatId || (!text && !file)) return res.status(400).json({ error: "Invalid message" });

  try {
    const newMsg = await Message.create({
      chat: chatId,
      sender: req.user.id,
      text,
      file,
    });

    // Update chat updatedAt for sorting in frontend
    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

    const populatedMsg = await Message.findById(newMsg._id).populate("sender", "username email");
    res.status(200).json(populatedMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;