const { REST, Routes } = require("discord.js");
require("dotenv").config();

const commands = [
  {
    name: "report",
    description: "Registra tu progreso diario",
  },
  {
    name: "records",
    description: "Muestra los últimos 10 registros de un usuario",
    options: [
      {
        name: "usuario",
        type: 6, // USER
        description: "El usuario cuyos registros quieres ver",
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("⌛ Registrando comandos...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Comandos registrados con éxito.");
  } catch (error) {
    console.error("❌ Error al registrar comandos:", error);
  }
})();
