const router = require("express").Router();
const User = require("../models/User");

// 1. SEGUIR A UN USUARIO
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const userToFollow = await User.findById(req.params.id); // Al que queremos seguir
      const currentUser = await User.findById(req.body.userId); // Nosotros

      if (!userToFollow.followers.includes(req.body.userId)) {
        await userToFollow.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("¡Ahora sigues a este usuario!");
      } else {
        res.status(403).json("Ya sigues a este usuario");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("No te puedes seguir a ti mismo");
  }
});

// 2. OBTENER TODOS LOS USUARIOS (Para sugerirte a quién seguir)
router.get("/all/everybody", async (req, res) => {
  try {
    const users = await User.find({}, "username profilePic _id"); // Solo traemos nombre, foto e ID
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;