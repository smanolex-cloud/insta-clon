const axios = require("axios");

// LEER LAS URLS DE RENDER
const REPLICAS = [
    process.env.REPLICA_1_URL,
    process.env.REPLICA_2_URL
].filter(url => url);

let failedReplications = [];

// --- FUNCIÓN PRINCIPAL PARA EXPORTAR ---
const replicateData = async (actionType, payload) => {
    if (REPLICAS.length === 0) return;

    const dataPacket = {
        action: actionType,
        timestamp: new Date(),
        payload: payload
    };

    console.log(`📡 [Sistema] Replicando: ${actionType} a ${REPLICAS.length} nodos...`);

    REPLICAS.forEach(async (nodeUrl) => {
        try {
            await axios.post(`${nodeUrl}/replicate`, dataPacket);
            console.log(`✅ Replicado en ${nodeUrl}`);
        } catch (err) {
            console.error(`❌ Fallo en ${nodeUrl}. Encolando...`);
            failedReplications.push({ node: nodeUrl, data: dataPacket });
        }
    });
};

// --- SISTEMA DE RECUPERACIÓN (CRON JOB) ---
setInterval(async () => {
    if (failedReplications.length > 0) {
        console.log(`🔄 Reintentando ${failedReplications.length} operaciones...`);
        const queue = [...failedReplications];
        failedReplications = [];

        queue.forEach(async (item) => {
            try {
                await axios.post(`${item.node}/replicate`, item.data);
                console.log(`♻️ Recuperado en ${item.node}`);
            } catch (err) {
                failedReplications.push(item);
            }
        });
    }
}, 20000); // Cada 20 segundos

module.exports = { replicateData };