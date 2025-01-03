// @ts-nocheck

// Command Option Types
// Activity Types
// Presence Status Types
const {
  ApplicationCommandOptionType,
  ActivityType,
  PresenceUpdateStatus
} = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const AsciiTable = require('ascii-table') // Pretty-print to console

module.exports = class BotActivityCommand extends BotDevCommand {
  constructor(client, comprops, props={}) {
    comprops = {
      name: "botactivity",
      category: "bot",
      description: "Bot Activity setter",
      options: [
        {
          name: "activity-id",
          description: "Activity ID",
          type: ApplicationCommandOptionType.Integer,
          choices: [
            { name: "Competing",  value: ActivityType.Competing },
            { name: "Custom",     value: ActivityType.Custom },
            { name: "Listening",  value: ActivityType.Listening },
            { name: "Playing",    value: ActivityType.Playing },
            { name: "Streaming",  value: ActivityType.Streaming },
            { name: "Watching",   value: ActivityType.Watching }
          ]
        },
        {
          name: "activity-type",
          description: "Activity Type",
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: "Competing",  value: "competing" },
            { name: "Custom",     value: "custom" },
            { name: "Listening",  value: "listening" },
            { name: "Playing",    value: "playing" },
            { name: "Streaming",  value: "streaming" },
            { name: "Watching",   value: "watching" }
          ]
        },
        {
          name: "message",
          description: "Activity Message",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "stream-url",
          description: "Stream URL",
          type: ApplicationCommandOptionType.String
        }
      ],
      testOptions: [
        { "message": "Slash Commands" },
        { "activity-type": "playing" },
        { "activity-type": "playing", "message": "with Tinkertoys" },
        { "activity-type": "competing", "message": "an Asynchronous Race" },
        { "stream-url": "http://example.com/stream" },
        { "stream-url": "http://twitch.tv/minnietrethewey" },
        { "activity-type": "watching", "stream-url": "http://twitch.tv/minnietrethewey" },
        {}
      ]
    }
    super(
      client,
      { ...comprops },
      { ...props }
    )
  }

  async action(client, interaction, coptions) {
    // Default supported activities
    let activityNames = [
      "playing",
      "streaming",
      "listening",
      "watching",
      "custom",
      "competing"
    ]

    // Default to listening
    let defaultActivity = "listening"
    let activityType    = coptions["activity-type"] || defaultActivity
    let activityID      = coptions["activity-id"] || activityNames.indexOf(activityType.toLowerCase())
    let prefix          = client?.optons?.defaultPrefix ||
                          client?.options?.prefix ||
                          client?.prefix ||
                          "/"
    let msg = coptions["message"] || prefix + "help"
    let url = ""

    let padding = 20

    const Table = new AsciiTable("", {})

    // Print sent data
    if (this.DEV) {
      Table.addRow("Sent activity", `[${ActivityType[activityID]}] [${activityID}]`)
    }

    // If we received a URL, parse it
    if (coptions["stream-url"] != "") {
      try {
        let tryURL = coptions["stream-url"]
          .replace("<", "")
          .replace(">", "")
        let urlParts = new URL(tryURL)
        if (urlParts) {
          if (
            // Only accept twitch or YouTube
            urlParts.host.includes("twitch.tv") ||
            urlParts.host.includes("youtube.com")
          ) {
            url = urlParts
          }
          if (this.DEV) {
            Table.addRow("Sent URL", url)
          }
        }
      } catch {
        // do nothing
      }
    }
    if (this.DEV) {
      Table.addRow("Sent msg", msg)
    }

    // Sanity check
    if (activityType.toLowerCase() == "moo") {
      activityType = defaultActivity
    }

    // If we've got a URL, set to Streaming
    if (url != "") {
      activityType = "streaming"
    } else if ((activityType.toLowerCase() == "streaming") && url == "") {
      activityType = defaultActivity
    }

    // Print new data
    if (this.DEV) {
      Table.addRow("New activity", activityType.toUpperCase() + ` [${activityID}]`)
    }

    activityID = activityNames.indexOf(activityType.toLowerCase())

    if (activityType !== "") {
      let activityOptions = {
        name: msg,
        type: ActivityType[activityType.ucfirst()]
      }
      if (url != "") {
        activityOptions.url = url
      }
      let presenceOptions = {
        activities: [activityOptions],
        afk: false,
        status: PresenceUpdateStatus.Online
      }

      client.user.setPresence(presenceOptions)

      let desc = "Status changed succesfully: "
      desc += ActivityType[activityID]
      if (activityType.toLowerCase() == "listening") {
        desc += " to"
      } else if (activityType.toLowerCase() == "competing") {
        desc += " in"
      }
      if (this.DEV) {
        Table.addRow(
          "New Message",
          desc.substr(desc.indexOf(':') + 1).trim() + " " + activityOptions.name
        )
        console.log(Table.toString())
      }
      desc += " "
      desc += "**"
      desc += activityOptions?.url ? `[${activityOptions.name}](${activityOptions.url})` : activityOptions.name
      desc += "**"
      this.props.description = desc
      this.props.fields = [
        [
          {
            name: "Activity Name",
            value: ActivityType[activityID].codeblock()
          },
          {
            name: "Activity ID",
            value: activityID.codeblock()
          }
        ],
        [
          {
            name: "Message",
            value: activityOptions?.url ? `[${activityOptions.name.inlinecode()}](${activityOptions.url})` : activityOptions.name.codeblock()
          }
        ]
      ]
    }
  }
}
