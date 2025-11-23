const router = require("express").Router();
const Notification = require("../models/Notification");

// 1. OBTENER MIS NOTIFICACIONES
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.params.userId })
      .sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. MARCAR COMO LEÍDAS (INTELIGENTE)
router.put("/read/:userId", async (req, res) => {
  try {
    // Filtro base: solo las no leídas de este usuario
    let filter = { recipientId: req.params.userId, isRead: false };

    // Si el frontend nos dice "solo mensajes", agregamos ese filtro
    if (req.body.type === "message") {
      filter.type = "message";
    } 
    // Si el frontend nos dice "todo MENOS mensajes" (para la campana)
    else if (req.body.exclude === "message") {
      filter.type = { $ne: "message" }; // $ne significa "Not Equal" (No igual a)
    }

    await Notification.updateMany(filter, { $set: { isRead: true } });
    res.status(200).json("Notificaciones actualizadas");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;