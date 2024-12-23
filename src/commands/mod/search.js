const { PermissionFlagsBits, ApplicationCommandOptionType, time, TimestampStyles } = require('discord.js')
const { ModCommand } = require('../../classes/command/modcommand.class')
const path = require('path')
const fs = require('fs')

module.exports = class SearchCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "search",
      category: "mod",
      description: "Search Logs",
      flags: {
        bot: "optional",
        target: "required"
      },
      options: [
        {
          name: "search-type",
          description: "Search Type",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Membership",     value: "Change" },
            { name: "Ghost Messages", value: "ghostMessage" },
            { name: "Bans",           value: "Ban" },
            { name: "Mutes",          value: "Mute" },
            { name: "Unbans",         value: "Unban" },
            { name: "Unmutes",        value: "Unmute" },
            { name: "Timeouts",       value: "Timeout" },
            { name: "Warns",          value: "Warn" }
          ]
        },
        {
          name: "target-id",
          description: "User ID to search for",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "region",
          description: "Development or Production Logs?",
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: "Production", value: "" },
            { name: "Development", value: "DEV" }
          ]
        }
      ],
      testOptions: [
        {
          "target-id":    "282859044593598464",
          "search-type":  "Change"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Warn"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Mute"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Unmute"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Ban"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Unban"
        }
      ],
      permissions: [ PermissionFlagsBits.ModerateMembers ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async action(client, interaction, coptions) {
    let searchType = coptions["search-type"]
    let targetUserInput = coptions["target-id"]
    let region = coptions["region"] || (this.DEV ? "DEV" : "")
    let targetUserId = targetUserInput.replace(/[<@!>]/g, '');  // Remove <@>, <@!>, and >
    let targetUser;
    try {
      targetUser = await client.users.fetch(targetUserId);
    } catch (error) {
      props.mod.error = true
      props.mod.description = "User not found."
      this.props = props.mod
      return
    }
    // Get the guild member (to fetch nickname if present)
    const guildMember = interaction.guild.members.cache.get(targetUserId);
    const user = guildMember?.user || targetUser

    let logFileName = "" +
      region +
      (searchType != "ghostMessage" ? "member" : "") +
      searchType +
      "s.log"

    let logFilePath = path.join(
      __dirname,
      "..",
      "..",
      "botlogs",
      logFileName
    )

    let logFile = fs.readFileSync(logFilePath, "utf8")
    let logLines = logFile.split("\n")
    let foundLogs = {}
    let i = 0
    for(let line of logLines) {
      line = line.trim()
      if(
        (
          (line.indexOf("Author:") > -1) ||
          (line.indexOf("User:") > -1)
        ) &&
        (line.indexOf(targetUserId) > -1)
      ) {
        let beginning = i
        let running = true
        while(running) {
          if(logLines[beginning].indexOf("[") > -1) {
            running = false
          } else {
            beginning = beginning - 1
          }
        }
        running = true
        let end = beginning + 1
        while(running) {
          if(
            (logLines[end].indexOf("[") > -1) ||
            (logLines[end].substring(0,3) == "---") ||
            (logLines[end].trim() == "")
          ) {
            running = false
          } else {
            end = end + 1
          }
        }
        let foundLog = logLines.slice(beginning, end)
        foundLogs[foundLog[0]] = foundLog
      }
      i = i + 1
    }
    i = 1
    for(let [timestamp, foundLog] of Object.entries(foundLogs)) {
      let this_props = {
        title: { text: `Searching ${searchType}s` },
        description: `**User**\n${user}`,
        fields: [],
        timestamp: timestamp
      }
      for(let logLine of foundLog) {
        logLine = logLine.trim()
        if(logLine.indexOf(": ") > -1) {
          let field_name = logLine.substring(0, logLine.indexOf(": "))
          let field_value = logLine.substring(logLine.indexOf(": ") + ": ".length)
          field_value = field_value.replace(/([\d]{5,})/, "`$1`")
          this_props.fields.push(
            [
              {
                name: field_name,
                value: field_value
              }
            ]
          )
        } else if(logLine.indexOf("Z]") > -1) {
          let timestamp = Date.parse(logLine.replace("[","").replace("]",""))
          let timestr = time(parseInt(timestamp / 1000), TimestampStyles.LongDateTime)
          this_props.fields.push(
            [
              {
                name: "Time",
                value: timestr
              }
            ]
          )
        }
      }
      this.pages.push(this_props)
      i = i +1
    }
  }
}
