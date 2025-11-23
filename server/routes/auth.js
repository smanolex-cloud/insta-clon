const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

// REGISTRAR USUARIO
router.post("/register", async (req, res) => {
  try {
    // 1. Encriptar contraseña (para seguridad)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 2. Crear usuario nuevo
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    // 3. Guardar en Base de Datos
    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGIN (INICIAR SESIÓN)
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json("Usuario no encontrado");

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json("Contraseña incorrecta");

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;