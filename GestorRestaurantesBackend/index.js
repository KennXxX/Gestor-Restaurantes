"use strict";

import "dotenv/config";
import app from "./configs/app.js";
import { dbConnection } from "./configs/db.js";
import { seedData } from "./configs/data-seeder.js";

const PORT = process.env.PORT || 3000;

await dbConnection();
await seedData();

app.listen(PORT, () => {
	console.log(`API escuchando en puerto ${PORT}`);
});
