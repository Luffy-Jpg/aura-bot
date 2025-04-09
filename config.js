/* Copyright (C) Aura Bot Team.

Licensed under the GPL-3.0 License.
*/

const { Sequelize } = require("sequelize");
const fs = require("fs");
if (fs.existsSync("config.env")) require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}

DATABASE_URL =
  process.env.DATABASE_URL === undefined ? "./aura.db" : process.env.DATABASE_URL;
DEBUG =
  process.env.DEBUG === undefined ? false : convertToBool(process.env.DEBUG);

module.exports = {
  VERSION: "v1.0.0-aura",
  SESSION: process.env.AURA_SESSION || "",
  EXT: process.env.EXT || undefined,
  LANG: process.env.LANGUAGE ? process.env.LANGUAGE.toUpperCase() : "EN",
  HANDLERS: process.env.HANDLERS || "^[.]",
  SEND_READ: convertToBool(process.env.SEND_READ, "true"),
  BRANCH: "main",
  HEROKU: {
    HEROKU: convertToBool(process.env.HEROKU),
    API_KEY: process.env.HEROKU_API_KEY || "",
    APP_NAME: process.env.HEROKU_APP_NAME || "",
  },
  DATABASE_URL,
  DATABASE:
    DATABASE_URL === "./aura.db"
      ? new Sequelize({
          dialect: "sqlite",
          storage: DATABASE_URL,
          logging: DEBUG,
        })
      : new Sequelize(DATABASE_URL, {
          host: "xxxxx.compute.amazonaws.com",
          dialect: "postgres",
          ssl: true,
          protocol: "postgres",
          logging: DEBUG,
          dialectOptions: {
            native: true,
            ssl: { require: true, rejectUnauthorized: false },
          },
        }),
  NO_ONLINE: convertToBool(process.env.NO_ONLINE),
  CLR_SESSION: convertToBool(process.env.CLR_SESSION),
  SUDO: process.env.SUDO || "owner@s.whatsapp.net",
  DEBUG,
  REMOVEBG: process.env.REMOVEBG_KEY || "false",
  WARN_COUNT: process.env.WARN_COUNT || 3,
  WARN_MSG: process.env.WARN_MSG || "Calm down or get booted.",
  ANTIJID: process.env.ANTIJID || "",
  STICKER_PACKNAME: process.env.STICKER_PACKNAME || "AuraBot Pack",
  BRAINSHOP: process.env.BRAINSHOP || "159501,6pq8dPiYt7PdqHz3",
  DIS_BOT: process.env.DISABLE_BOT || "null",
  FIND_API_KEY: process.env.FIND_API_KEY || "null",
};
