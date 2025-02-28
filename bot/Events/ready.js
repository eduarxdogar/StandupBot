const schedule = require("node-schedule");

module.exports = {
  name: "ready", // El nombre exacto del evento
  once: true, // Solo se ejecuta la primera vez
  async execute(client) {
    console.log(`✅ Bot conectado como ${client.user.tag}`);

    // Programar recordatorio diario a las 9:00 AM
    schedule.scheduleJob("0 9 * * *", async () => {
      const channel = client.channels.cache.get(process.env.REPORT_CHANNEL_ID);
      if (channel) {
        channel.send({
          content:
            "📢 ¡Hora de registrar tu progreso diario! Usa el comando `/report`.",
        });
      }
    });
  },
};
