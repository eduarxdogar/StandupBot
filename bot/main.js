require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { loadEvents } = require("./events"); // Función que cargará eventos
const pool = require("./service/database"); // Conexión a MySQL (por si la necesitas aquí)

// Crea el cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

(async () => {
  try {
    console.log("✅ Conectado a MySQL");

    // Cargar los eventos (ready, interactionCreate, etc.)
    loadEvents(client);

    // Iniciar sesión en Discord
    client.login(process.env.TOKEN);
  } catch (error) {
    console.error("❌ Error iniciando el bot:", error);
  }
})();
