/* Aura Bot - Powerful WhatsApp Userbot
   Custom Build for Aura Project
   Licensed under GPL-3.0 by Luffy-Jpg
*/

const fs = require("fs")
const path = require("path")
const chalk = require("chalk")
const got = require("got")
const { DataTypes } = require("sequelize")
const { WAConnection, MessageType } = require("@adiwajshing/baileys")

const config = require("./config")
const { StringSession } = require("./Utilis/whatsasena")
const { handleMessages } = require("./Utilis/msg")
const { getJson } = require("./Utilis/download")
const { customMessageScheduler } = require("./Utilis/schedule")
const { prepareGreetingMedia } = require("./Utilis/greetings")
const { groupMuteSchuler, groupUnmuteSchuler } = require("./Utilis/groupmute")
const { PluginDB } = require("./plugins/sql/plugin")
const { startMessage, waWebVersion } = require("./Utilis/Misc")

// Aura DB Init
const AuraDB = config.DATABASE.define("AuraBot", {
  info: { type: DataTypes.STRING, allowNull: false },
  value: { type: DataTypes.TEXT, allowNull: false }
})

// Load SQL Plugins
fs.readdirSync("./plugins/sql/").forEach((plugin) => {
  if (plugin.endsWith(".js")) {
    require("./plugins/sql/" + plugin)
  }
})

// Utility Formatters
String.prototype.format = function () {
  var i = 0, args = arguments
  return this.replace(/{}/g, () => typeof args[i] !== "undefined" ? args[i++] : "")
}

Array.prototype.remove = function () {
  var what, a = arguments, L = a.length, ax
  while (L && this.length) {
    what = a[--L]
    while ((ax = this.indexOf(what)) !== -1) {
      this.splice(ax, 1)
    }
  }
  return this
}

async function auraBot(version) {
  await config.DATABASE.sync()
  let savedSession = await AuraDB.findAll({ where: { info: "StringSession" } })
  const conn = new WAConnection()
  conn.version = version
  const Session = new StringSession()
  conn.logger.level = config.DEBUG ? "debug" : "warn"

  let noDbSession = false
  if (savedSession.length < 1 || config.CLR_SESSION) {
    noDbSession = true
    conn.loadAuthInfo(Session.deCrypt(config.SESSION))
  } else {
    conn.loadAuthInfo(Session.deCrypt(savedSession[0].dataValues.value))
  }

  // Aura Connect Events
  conn.on("connecting", () => {
    console.log(chalk.magentaBright(`
╭━━━╮╱╱╱╱╱╭╮
┃╭━━╯╱╱╱╱╱┃┃
┃╰━━┳━━┳━━┫┃╭┳━╮
┃╭━━┫╭╮┃┃━┫╰╯┫╭╯
┃┃╱╱┃╭╮┃┃━┫╭╮┫┃
╰╯╱╱╰╯╰┻━━┻╯╰┻╯  v${config.VERSION}
Connecting to Aura's WhatsApp bridge...
`))
  })

  conn.on("open", async () => {
    console.log(chalk.green.bold("✅ Aura Bot connected successfully!"))

    const authInfo = conn.base64EncodedAuthInfo()
    if (savedSession.length < 1) {
      await AuraDB.create({ info: "StringSession", value: Session.createStringSession(authInfo) })
    } else {
      await savedSession[0].update({ value: Session.createStringSession(authInfo) })
    }

    // Load remote plugins
    const plugins = await PluginDB.findAll()
    for (let plugin of plugins) {
      if (!fs.existsSync("./plugins/" + plugin.dataValues.name + ".js")) {
        try {
          let response = await got(plugin.dataValues.url)
          if (response.statusCode === 200) {
            fs.writeFileSync("./plugins/" + plugin.dataValues.name + ".js", response.body)
            require("./plugins/" + plugin.dataValues.name + ".js")
            console.log(`⬇️  Loaded external plugin: ${plugin.dataValues.name}`)
          }
        } catch {
          console.log(`❌ Failed to load external plugin: ${plugin.dataValues.name}`)
        }
      }
    }

    // Load internal plugins
    fs.readdirSync("./plugins").forEach((plugin) => {
      if (plugin.endsWith(".js")) {
        require("./plugins/" + plugin)
      }
    })

    console.log(chalk.green.bold("✅ All plugins initialized!"))
    await conn.sendMessage(conn.user.jid, await startMessage(), MessageType.text, { detectLinks: false })
  })

  conn.on("close", (e) => console.log(chalk.red(`Connection closed: ${e.reason}`)))

  // Background Tasks
  await groupMuteSchuler(conn)
  await groupUnmuteSchuler(conn)
  await customMessageScheduler(conn)

  // Handle Messages
  conn.on("chat-update", (m) => {
    if (!m.hasNewMessage) return
    if (!m.messages || !m.count) return
    handleMessages(m.messages.all()[0], conn)
  })

  try {
    await conn.connect()
  } catch (e) {
    if (!noDbSession) {
      console.log(chalk.red("Retrying login with saved session..."))
      conn.loadAuthInfo(Session.deCrypt(config.SESSION))
      try {
        await conn.connect()
      } catch {
        console.log("Failed to reconnect.")
      }
    } else {
      console.log(`❌ Login error: ${e.message}`)
    }
  }
}

// Boot Aura Bot
;(async () => {
  await prepareGreetingMedia()
  auraBot(await waWebVersion())
})()
