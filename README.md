# StandupBot

StandupBot es un bot de Discord desarrollado en **Node.js** con la librería **discord.js v14**. Su propósito principal es facilitar la gestión de reuniones diarias tipo stand-up dentro de servidores de Discord, automatizando mensajes y recordatorios para los participantes.

## 🚀 Tecnologías utilizadas

- **Node.js** - Entorno de ejecución para JavaScript.
- **discord.js v14** - Librería para interactuar con la API de Discord.
- **dotenv** - Para manejar variables de entorno de manera segura.
- **mysql2** - Para la conexión con una base de datos MySQL.
- **sequelize** - ORM para manejar la base de datos de forma sencilla.

## 📦 Instalación

1. Clona este repositorio:
   ```sh
   git clone https://github.com/eduarxdogar/StandupBot.git
   ```
2. Accede a la carpeta del proyecto:
   ```sh
   cd StandupBot
   ```
3. Instala las dependencias:
   ```sh
   npm install
   ```
4. Crea un archivo `.env` en la raíz del proyecto y agrega tus credenciales de Discord y base de datos:
   ```sh
   BOT_TOKEN=tu_token_aqui
   DB_HOST=localhost
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_NAME=standup_bot
   ```

## 🛠 Uso

Para iniciar el bot, usa el siguiente comando:
```sh
node bot/index.js
```
Si prefieres usar nodemon para reiniciar automáticamente el bot en caso de cambios:
```sh
npx nodemon bot/index.js
```

## 📜 Funcionalidades

- Registro de comandos de bot en Discord.
- Almacenamiento de información en MySQL con Sequelize.
- Comando `/standup` para iniciar reuniones diarias.
- Mensajes automatizados para recordatorios.

## 🚧 Próximas mejoras

- Integración con un dashboard web.
- Configuración personalizada de recordatorios.
- Más comandos para gestión de equipos.

## 🤝 Contribuciones
Si quieres contribuir, haz un fork del proyecto, crea una nueva rama y envía un pull request con tus mejoras.

## 📝 Licencia
Este proyecto está bajo la licencia MIT.

