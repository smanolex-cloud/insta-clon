const router = require("express").Router();
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { replicateData } = require("../replicationService"); // <--- IMPORTAR SERVICIO

// ENVIAR MENSAJE
router.post("/", async (req, res) => {
  const newMessage = new Message(req.body);
  try {
    const savedMessage = await newMessage.save();

    // 🔥 REPLICAR EL MENSAJE COMPLETO 🔥
    replicateData("NUEVO_MENSAJE", savedMessage);

    // Crear notificación
    if (req.body.senderId !== req.body.receiverId) {
        const sender = await User.findById(req.body.senderId);
        const newNoti = new Notification({ recipientId: req.body.receiverId, senderId: req.body.senderId, senderName: sender.username, type: "message", text: "Te envió un mensaje" });
        await newNoti.save();
    }

    res.status(200).json(savedMessage);
  } catch (err) { res.status(500).json(err); }
});

// LEER (Sin cambios)
router.get("/:myId/:friendId", async (req, res) => {
  try {
    const messages = await Message.find({ $or: [ { senderId: req.params.myId, receiverId: req.params.friendId }, { senderId: req.params.friendId, receiverId: req.params.myId } ] }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;