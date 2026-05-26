import { config } from "./config.js";
import { createApp } from "./app.js";

createApp().listen(config.port, config.host, () => {
  console.log(`AgentLab Console listening at http://${config.host}:${config.port}`);
});
