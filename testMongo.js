// 📁 testMongo.js
const mongoose = require("mongoose");

mongoose
  .connect("mongodb+srv://omarque:ejaubG9hEYbGU8qZ@cluster0.mokbgf6.mongodb.net/kubera?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ Conexión a MongoDB Atlas exitosa"))
  .catch((err) => console.error("❌ Error de conexión:", err));
