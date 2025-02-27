require("dotenv").config();
const pool = require("./database");
const {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const schedule = require("node-schedule");

(async () => {
  try {
    console.log("✅ Conectado a MySQL");

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.once("ready", () => {
      console.log(`✅ Bot conectado como ${client.user.tag}`);
      scheduleDailyReminder();
    });

    client.login(process.env.TOKEN);

    function scheduleDailyReminder() {
      schedule.scheduleJob("0 9 * * *", async () => {
        const channel = client.channels.cache.get(
          process.env.REPORT_CHANNEL_ID
        );
        if (channel) {
          channel.send(
            "📢 ¡Hora de registrar tu progreso diario! Usa el comando `/report`."
          );
        }
      });
    }

    client.on("interactionCreate", async (interaction) => {
      if (interaction.isCommand()) {
        switch (interaction.commandName) {
          case "report":
            const modal = new ModalBuilder()
              .setCustomId("standup_report")
              .setTitle("Reporte Diario");

            const ayerInput = new TextInputBuilder()
              .setCustomId("ayer")
              .setLabel("¿Qué hiciste ayer?")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true);

            const hoyInput = new TextInputBuilder()
              .setCustomId("hoy")
              .setLabel("¿Qué harás hoy?")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true);

            const bloqueosInput = new TextInputBuilder()
              .setCustomId("bloqueos")
              .setLabel("¿Tienes bloqueos?")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false);

            const row1 = new ActionRowBuilder().addComponents(ayerInput);
            const row2 = new ActionRowBuilder().addComponents(hoyInput);
            const row3 = new ActionRowBuilder().addComponents(bloqueosInput);

            modal.addComponents(row1, row2, row3);
            await interaction.showModal(modal);
            break;

          case "records":
            const user = interaction.options.getUser("usuario");

            try {
              const [result] = await pool.execute(
                "SELECT * FROM StandupReports WHERE discord_id = ? ORDER BY fecha DESC LIMIT 10",
                [user.id]
              );

              if (result.length === 0) {
                return interaction.reply({
                  content: "❌ No hay registros para este usuario.",
                  ephemeral: true,
                });
              }

              let message = "📜 **Últimos registros:**\n";
              result.forEach((report) => {
                message += `📆 **Fecha:** ${report.fecha} \n🔹 **Ayer:** ${report.que_hice_ayer} \n🔹 **Hoy:** ${report.que_hare_hoy} \n🔹 **Bloqueos:** ${report.bloqueos} \n\n`;
              });

              if (message.length > 2000) {
                const buffer = Buffer.from(message, "utf-8");
                return interaction.reply({
                  files: [{ attachment: buffer, name: "registros.txt" }],
                  ephemeral: true,
                });
              }

              await interaction.reply({ content: message, ephemeral: true });
            } catch (error) {
              console.error("❌ Error al obtener registros:", error);
              await interaction.reply({
                content: "❌ Hubo un error al consultar los registros.",
                ephemeral: true,
              });
            }
            break;
        }
      } else if (
        interaction.isModalSubmit() &&
        interaction.customId === "standup_report"
      ) {
        const ayer = interaction.fields.getTextInputValue("ayer");
        const hoy = interaction.fields.getTextInputValue("hoy");
        const bloqueos =
          interaction.fields.getTextInputValue("bloqueos") || "Ninguno";

        try {
          await pool.execute(
            `INSERT INTO StandupReports (discord_id, que_hice_ayer, que_hare_hoy, bloqueos) VALUES (?, ?, ?, ?)`,
            [interaction.user.id, ayer, hoy, bloqueos]
          );

          await interaction.reply({
            content: "✅ Reporte registrado exitosamente.",
            ephemeral: true,
          });
        } catch (error) {
          console.error("❌ Error al insertar el reporte:", error);
          await interaction.reply({
            content: "❌ Hubo un error al registrar el reporte.",
            ephemeral: true,
          });
        }
      }
    });
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error);
  }
})();
