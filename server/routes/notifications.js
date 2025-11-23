const router = require("express").Router();
const Notification = require("../models/Notification");

// 1. OBTENER MIS NOTIFICACIONES
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.params.userId })
      .sort({ createdAt: -1 }); // Las más nuevas primero
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. MARCAR TODAS COMO LEÍDAS
router.put("/read/:userId", async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.params.userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json("Notificaciones leídas");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;