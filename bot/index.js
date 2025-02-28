/** 
require("dotenv").config();
const pool = require("./service");
const {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  AttachmentBuilder,
} = require("discord.js");
const schedule = require("node-schedule");

(async () => {
  try {
    console.log("✅ Conectado a MySQL");

    // Crear el cliente de Discord con los intents necesarios
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    // Evento que se dispara cuando el bot está listo
    client.once("ready", () => {
      console.log(`✅ Bot conectado como ${client.user.tag}`);
      scheduleDailyReminder();
    });

    // Iniciar sesión en Discord
    client.login(process.env.TOKEN);

   
    function scheduleDailyReminder() {
      schedule.scheduleJob("0 9 * * *", async () => {
        const channel = client.channels.cache.get(
          process.env.REPORT_CHANNEL_ID
        );
        if (channel) {
          channel.send({
            content:
              "📢 ¡Hora de registrar tu progreso diario! Usa el comando `/report`.",
          });
        }
      });
    }

   
    client.on("interactionCreate", async (interaction) => {
      // Si es un comando de barra
      if (interaction.isCommand()) {
        switch (interaction.commandName) {
        
          case "report": {
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

            // Agregar campos al modal (máximo 5 componentes)
            const row1 = new ActionRowBuilder().addComponents(ayerInput);
            const row2 = new ActionRowBuilder().addComponents(hoyInput);
            const row3 = new ActionRowBuilder().addComponents(bloqueosInput);

            modal.addComponents(row1, row2, row3);
            await interaction.showModal(modal);
            break;
          }

       
          case "records": {
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
                message += `📆 **Fecha:** ${report.fecha}\n`;
                message += `🔹 **Ayer:** ${report.que_hice_ayer}\n`;
                message += `🔹 **Hoy:** ${report.que_hare_hoy}\n`;
                message += `🔹 **Bloqueos:** ${report.bloqueos}\n`;
                if (report.imagen_url) {
                  message += `🖼 **Imagen:** ${report.imagen_url}\n`;
                }
                message += "\n";
              });

              // Si el mensaje excede 2000 caracteres, enviarlo como archivo
              if (message.length > 2000) {
                const buffer = Buffer.from(message, "utf-8");
                const file = new AttachmentBuilder(buffer, {
                  name: "registros.txt",
                });
                return interaction.reply({
                  files: [file],
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
        }
      }
      // Si es el envío del modal
      else if (
        interaction.isModalSubmit() &&
        interaction.customId === "standup_report"
      ) {
        // Obtener campos del modal
        const ayer = interaction.fields.getTextInputValue("ayer");
        const hoy = interaction.fields.getTextInputValue("hoy");
        const bloqueos =
          interaction.fields.getTextInputValue("bloqueos") || "Ninguno";

        // 1. Responder para que el usuario sepa que puede subir imagen
        await interaction.reply({
          content:
            "📸 Si quieres adjuntar una imagen, envíala en los próximos 30 segundos.",
          ephemeral: true,
        });

        // 2. Crear un collector para escuchar el siguiente mensaje con imagen
        const filter = (msg) =>
          msg.author.id === interaction.user.id && msg.attachments.size > 0;
        const collector = interaction.channel.createMessageCollector({
          filter,
          time: 50000,
        });

        // 3. Si el usuario envía una imagen
        collector.on("collect", async (msg) => {
          const imageUrl = msg.attachments.first().url;
          try {
            await pool.execute(
              `INSERT INTO StandupReports (discord_id, que_hice_ayer, que_hare_hoy, bloqueos, imagen_url) 
               VALUES (?, ?, ?, ?, ?)`,
              [interaction.user.id, ayer, hoy, bloqueos, imageUrl]
            );
            await msg.reply("✅ Reporte registrado con imagen.");
          } catch (error) {
            console.error("❌ Error al guardar el reporte con imagen:", error);
            await msg.reply("❌ Hubo un error al registrar la imagen.");
          }
          collector.stop();
        });

        // 4. Si no adjunta imagen, guardar solo el texto
        collector.on("end", async (collected) => {
          if (collected.size === 0) {
            // Guardar sin imagen
            try {
              await pool.execute(
                `INSERT INTO StandupReports (discord_id, que_hice_ayer, que_hare_hoy, bloqueos) 
                 VALUES (?, ?, ?, ?)`,
                [interaction.user.id, ayer, hoy, bloqueos]
              );
              // Usa followUp porque ya respondiste con interaction.reply
              await interaction.followUp({
                content: "✅ Reporte registrado sin imagen.",
                ephemeral: true,
              });
            } catch (error) {
              console.error("❌ Error al guardar reporte sin imagen:", error);
              await interaction.followUp({
                content: "❌ Error al registrar el reporte sin imagen.",
                ephemeral: true,
              });
            }
          }
        });
      }
    });
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error);
  }
})();

*/
