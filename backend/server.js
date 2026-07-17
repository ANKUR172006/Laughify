require("dotenv").config();

const app = require("./src/app");
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
require("./src/config/moodifyDatabase").connectToDb();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

