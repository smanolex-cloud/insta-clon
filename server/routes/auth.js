const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { replicateData } = require("../replicationService"); // <--- IMPORTAR EL MAESTRO

// REGISTRAR USUARIO (CON REPLICACIÓN)
router.post("/register", async (req, res) => {
  try {
    // 1. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 2. Crear usuario
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword, // <--- AQUÍ SE GUARDA ENCRIPTADA
    });

    // 3. Guardar en MongoDB Principal
    const user = await newUser.save();

    // 4. 🔥 REPLICAR A LOS NODOS 🔥
    // Se envía el objeto 'user' que ya tiene el password hasheado ($2b$10$...)
    replicateData("NUEVO_USUARIO", user);

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGIN (Este no se replica, solo es lectura)
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