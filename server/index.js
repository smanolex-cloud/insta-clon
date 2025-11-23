const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const userRoute = require("./routes/users");
const messageRoute = require("./routes/messages");
require("dotenv").config();

const app = express();

// Middlewares
app.use(express.json());
// FORZAMOS CORS para permitir conexiones desde Vercel (o cualquier lugar)
app.use(cors({
    origin: '*' 
})); 

// RUTAS
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/users", userRoute);
app.use("/api/messages", messageRoute);

// Conexión a Base de Datos
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a la Base de Datos"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// Ruta de prueba
app.get("/", (req, res) => { res.send("¡Backend Listo y Permisivo!"); });

// Encender servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});