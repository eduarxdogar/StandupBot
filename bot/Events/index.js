const fs = require("fs");
const path = require("path");

/**
 * Carga todos los archivos de eventos en la carpeta "events"
 * y los registra en el bot.
 */
function loadEvents(client) {
  const eventsPath = __dirname; // Carpeta actual no es necesario ponerla manualmente (events)
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    // event.name => 'ready', 'interactionCreate', etc.
    // event.execute => la función que maneja el evento
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

module.exports = { loadEvents };
