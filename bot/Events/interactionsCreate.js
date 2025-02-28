const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const pool = require("../service/database"); // Conexión MySQL

module.exports = {
  name: "interactionCreate", // Nombre del evento
  async execute(interaction, client) {
    // Manejo de slash commands
    if (interaction.isCommand()) {
      if (interaction.commandName === "report") {
        // Mostrar modal
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
      } else if (interaction.commandName === "records") {
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

          if (message.length > 2000) {
            // Enviar como archivo
            const { AttachmentBuilder } = require("discord.js");
            const buffer = Buffer.from(message, "utf-8");
            const file = new AttachmentBuilder(buffer, {
              name: "registros.txt",
            });
            return interaction.reply({ files: [file], ephemeral: true });
          }

          await interaction.reply({ content: message, ephemeral: true });
        } catch (error) {
          console.error("❌ Error al obtener registros:", error);
          await interaction.reply({
            content: "❌ Hubo un error al consultar los registros.",
            ephemeral: true,
          });
        }
      }
    }

    // Manejo de envío del modal
    else if (
      interaction.isModalSubmit() &&
      interaction.customId === "standup_report"
    ) {
      const ayer = interaction.fields.getTextInputValue("ayer");
      const hoy = interaction.fields.getTextInputValue("hoy");
      const bloqueos =
        interaction.fields.getTextInputValue("bloqueos") || "Ninguno";

      // 1. Responder efímeramente para solicitar imagen
      await interaction.reply({
        content:
          "📸 Si quieres adjuntar una imagen, envíala en los próximos 30 segundos.",
        ephemeral: true,
      });

      // 2. Crear un collector para la imagen
      const filter = (msg) =>
        msg.author.id === interaction.user.id && msg.attachments.size > 0;
      const collector = interaction.channel.createMessageCollector({
        filter,
        time: 60000,
      });

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

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          // No enviaron imagen => Guardar solo el texto
          try {
            await pool.execute(
              `INSERT INTO StandupReports (discord_id, que_hice_ayer, que_hare_hoy, bloqueos)
               VALUES (?, ?, ?, ?)`,
              [interaction.user.id, ayer, hoy, bloqueos]
            );
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
  },
};
