require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commands = [
  {
    name: "report",
    description: "Abre un formulario para registrar tu progreso diario.",
  },
  {
    name: "records",
    description: "Muestra los últimos 10 registros de un usuario.",
    options: [
      {
        name: "usuario",
        type: 6, // Tipo USER
        description: "El usuario cuyos registros deseas ver",
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🔄 Registrando comandos...");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("✅ Comandos registrados correctamente.");
  } catch (error) {
    console.error("❌ Error registrando comandos:", error);
  }
})();
