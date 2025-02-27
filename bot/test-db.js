const { connectDB } = require("./database");

(async () => {
  await connectDB();
})();
