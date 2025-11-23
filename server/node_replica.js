const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 10000; 
const NODE_NAME = process.env.NODE_NAME || "Replica_Desconocida";
const DATA_FILE = path.join('/tmp', 'replica_full_backup.json');

if (!fs.existsSync(DATA_FILE)) { fs.writeFileSync(DATA_FILE, JSON.stringify([])); }

app.post("/replicate", (req, res) => {
    const { action, payload, timestamp } = req.body;
    
    console.log(`📥 [${NODE_NAME}] Recibido evento: ${action}`);

    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        const currentData = JSON.parse(fileContent);
        
        // Guardamos TODO lo que llegue (Usuarios, Posts, Borrados)
        currentData.push({
            eventType: action,
            data: payload,
            syncedAt: new Date(),
            originTimestamp: timestamp
        });
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));
        console.log(`✅ [${NODE_NAME}] Respaldo actualizado.`);
        
        res.status(200).json({ status: "ok" });
    } catch (error) {
        res.status(500).json({ error: "Fallo disco" });
    }
});

app.get("/data", (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
    } else { res.json([]); }
});

app.listen(PORT, () => { console.log(`🤖 ${NODE_NAME} ON`); });