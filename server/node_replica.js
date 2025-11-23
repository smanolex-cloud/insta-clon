const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());

// Render asigna el puerto automáticamente (suele ser 10000)
const PORT = process.env.PORT || 10000; 
const NODE_NAME = process.env.NODE_NAME || "Replica_Desconocida";

// Guardamos los datos en un archivo temporal del sistema
const DATA_FILE = path.join('/tmp', 'replica_storage.json');

// Iniciar archivo si no existe
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// RUTA QUE RECIBE LOS DATOS DEL LÍDER
app.post("/replicate", (req, res) => {
    const newData = req.body;
    console.log(`📥 [${NODE_NAME}] Recibiendo copia de seguridad...`);

    try {
        // 1. Leer archivo actual
        let currentData = [];
        if (fs.existsSync(DATA_FILE)) {
             const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
             // Evitamos error si el archivo está vacío
             if (fileContent) currentData = JSON.parse(fileContent);
        }
        
        // 2. Agregar dato nuevo
        currentData.push({ ...newData, replicatedAt: new Date() });
        
        // 3. Guardar
        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));

        console.log(`✅ [${NODE_NAME}] Guardado en disco.`);
        res.status(200).json({ message: "Guardado", node: NODE_NAME });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error disco" });
    }
});

// RUTA PARA VER QUÉ TIENE GUARDADO (Para comprobar que funciona)
app.get("/data", (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => {
    console.log(`🤖 ${NODE_NAME} escuchando en puerto ${PORT}`);
});