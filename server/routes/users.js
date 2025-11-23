const router = require("express").Router();
const User = require("../models/User");
const Notification = require("../models/Notification"); // <--- IMPORTANTE

// 1. SEGUIR USUARIO (CON NOTIFICACIÓN)
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const userToFollow = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      
      if (!userToFollow.followers.includes(req.body.userId)) {
        await userToFollow.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });

        // --- CREAR NOTIFICACIÓN ---
        const newNoti = new Notification({
          recipientId: req.params.id,
          senderId: req.body.userId,
          senderName: currentUser.username,
          type: "follow"
        });
        await newNoti.save();
        // --------------------------

        res.status(200).json("¡Ahora sigues a este usuario!");
      } else { res.status(403).json("Ya sigues a este usuario"); }
    } catch (err) { res.status(500).json(err); }
  } else { res.status(403).json("No te puedes seguir a ti mismo"); }
});

// 1.5 DEJAR DE SEGUIR
router.put("/:id/unfollow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
      try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.body.userId);
        if (userToUnfollow.followers.includes(req.body.userId)) {
          await userToUnfollow.updateOne({ $pull: { followers: req.body.userId } });
          await currentUser.updateOne({ $pull: { followings: req.params.id } });
          res.status(200).json("Usuario dejado de seguir");
        } else { res.status(403).json("No sigues a este usuario"); }
      } catch (err) { res.status(500).json(err); }
    } else { res.status(403).json("Error"); }
});

// LAS DEMÁS RUTAS SIGUEN IGUAL (Obtener, Buscar, Update, GetID, GetUsername)
router.get("/all/everybody", async (req, res) => {
  try { const users = await User.find({}, "username profilePic _id followers followings"); res.status(200).json(users); } catch (err) { res.status(500).json(err); }
});
router.get("/search/:query", async (req, res) => {
  try { const query = req.params.query; const users = await User.find({ username: { $regex: query, $options: "i" } }).limit(10); res.status(200).json(users); } catch (err) { res.status(500).json(err); }
});
router.put("/:id/update-pic", async (req, res) => {
  if (req.body.userId === req.params.id) { try { await User.findByIdAndUpdate(req.params.id, { $set: { profilePic: req.body.profilePic } }); res.status(200).json("Foto actualizada"); } catch (err) { res.status(500).json(err); } } else { res.status(403).json("Error"); }
});
router.get("/:id", async (req, res) => {
  try { const user = await User.findById(req.params.id); const { password, updatedAt, ...other } = user._doc; res.status(200).json(other); } catch (err) { res.status(500).json(err); }
});
router.get("/u/:username", async (req, res) => {
  try { const user = await User.findOne({ username: req.params.username }); const { password, updatedAt, ...other } = user._doc; res.status(200).json(other); } catch (err) { res.status(500).json(err); }
});

module.exports = router;