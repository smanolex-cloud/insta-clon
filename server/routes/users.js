const router = require("express").Router();
const User = require("../models/User");

// 1. SEGUIR A UN USUARIO
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

// 2. OBTENER TODOS LOS USUARIOS
router.get("/all/everybody", async (req, res) => {
  try {
    const users = await User.find({}, "username profilePic _id followers followings"); 
    res.status(200).json(users);
  } catch (err) { res.status(500).json(err); }
});

// 3. BUSCAR USUARIOS (NUEVO)
router.get("/search/:query", async (req, res) => {
  try {
    const query = req.params.query;
    // Busca coincidencias ignorando mayúsculas/minúsculas
    const users = await User.find({ username: { $regex: query, $options: "i" } }).limit(10);
    res.status(200).json(users);
  } catch (err) { res.status(500).json(err); }
});

// 4. ACTUALIZAR FOTO DE PERFIL (NUEVO)
router.put("/:id/update-pic", async (req, res) => {
  if (req.body.userId === req.params.id) {
    try {
      await User.findByIdAndUpdate(req.params.id, {
        $set: { profilePic: req.body.profilePic },
      });
      res.status(200).json("Foto actualizada");
    } catch (err) { res.status(500).json(err); }
  } else { res.status(403).json("Solo puedes actualizar tu cuenta"); }
});

module.exports = router;