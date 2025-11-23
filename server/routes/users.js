const router = require("express").Router();
const User = require("../models/User");

// 1. SEGUIR USUARIO
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const userToFollow = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!userToFollow.followers.includes(req.body.userId)) {
        await userToFollow.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("¡Ahora sigues a este usuario!");
      } else {
        res.status(403).json("Ya sigues a este usuario");
      }
    } catch (err) { res.status(500).json(err); }
  } else { res.status(403).json("No te puedes seguir a ti mismo"); }
});

// 2. OBTENER TODOS
router.get("/all/everybody", async (req, res) => {
  try {
    const users = await User.find({}, "username profilePic _id followers followings"); 
    res.status(200).json(users);
  } catch (err) { res.status(500).json(err); }
});

// 3. BUSCAR
router.get("/search/:query", async (req, res) => {
  try {
    const query = req.params.query;
    const users = await User.find({ username: { $regex: query, $options: "i" } }).limit(10);
    res.status(200).json(users);
  } catch (err) { res.status(500).json(err); }
});

// 4. ACTUALIZAR FOTO
router.put("/:id/update-pic", async (req, res) => {
  if (req.body.userId === req.params.id) {
    try {
      await User.findByIdAndUpdate(req.params.id, { $set: { profilePic: req.body.profilePic } });
      res.status(200).json("Foto actualizada");
    } catch (err) { res.status(500).json(err); }
  } else { res.status(403).json("Solo puedes actualizar tu cuenta"); }
});

// 5. OBTENER UN USUARIO POR ID (Para el Chat)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) { res.status(500).json(err); }
});

// 6. OBTENER UN USUARIO POR NOMBRE (Para el Perfil) <--- NUEVO
router.get("/u/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;