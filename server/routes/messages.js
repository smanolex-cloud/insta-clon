const router = require("express").Router();
const Message = require("../models/Message");
const Notification = require("../models/Notification"); // Importamos modelo
const User = require("../models/User"); // Importamos usuario para saber el nombre

// 1. ENVIAR MENSAJE (CON NOTIFICACIÓN)
router.post("/", async (req, res) => {
  const newMessage = new Message(req.body);
  try {
    const savedMessage = await newMessage.save();

    // --- CREAR NOTIFICACIÓN DE MENSAJE ---
    if (req.body.senderId !== req.body.receiverId) {
        // Buscamos el nombre de quien envía
        const sender = await User.findById(req.body.senderId);
        
        const newNoti = new Notification({
          recipientId: req.body.receiverId, // Para quien recibe
          senderId: req.body.senderId,      // De quien envía
          senderName: sender.username,      // Nombre de quien envía
          type: "message",                  // Tipo nuevo
          text: "Te envió un mensaje",      // Texto
        });
        await newNoti.save();
    }
    // -------------------------------------

    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. LEER MENSAJES
router.get("/:myId/:friendId", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.params.myId, receiverId: req.params.friendId },
        { senderId: req.params.friendId, receiverId: req.params.myId },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;