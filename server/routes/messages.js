const router = require("express").Router();
const Message = require("../models/Message");
const Notification = require("../models/Notification"); // Importar modelo
const User = require("../models/User"); // Importar usuario

// 1. ENVIAR MENSAJE + CREAR NOTIFICACIÓN
router.post("/", async (req, res) => {
  const newMessage = new Message(req.body);

  try {
    const savedMessage = await newMessage.save();

    // --- CREAR NOTIFICACIÓN ---
    // Si no me lo envío a mí mismo...
    if (req.body.senderId !== req.body.receiverId) {
        const sender = await User.findById(req.body.senderId);
        
        const newNoti = new Notification({
          recipientId: req.body.receiverId,
          senderId: req.body.senderId,
          senderName: sender.username,
          type: "message",
          text: "Te envió un mensaje"
        });
        await newNoti.save();
        console.log("Notificación de mensaje creada");
    }
    // --------------------------

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