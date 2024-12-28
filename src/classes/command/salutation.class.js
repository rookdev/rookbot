// @ts-nocheck

const { RookCommand } = require('./rcommand.class.js')
const { RookEmbed } = require('../embed/rembed.class.js')
const timeFormat = require('../../utils/timeFormat.js')
const colors = require('../../dbs/colors.json')
const shell = require('shelljs')
const path = require('path')
const fs = require('fs')
const timeConversion = require('../../utils/timeConversion.js')

/**
 * @class
 * @classdesc Instance Greeting
 * @this {SalutationCommand}
 * @extends {RookCommand}
 * @public
 */
class SalutationCommand extends RookCommand {
  constructor(client, comprops, props) {
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    let mode        = coptions?.mode || "boot"
    let onlineness  = mode == "boot" ? "Online" : "Offline"
    let readiness   = mode == "boot" ? "Ready"  : "Unready"
    let BRANCH      = null
    let COMMIT      = null

    let mode_msg = ""
    let mode_tag = ""

    if (this.DEV) {
      this.props.color = colors["warning"]
      mode_msg = "DEV MODE"
      mode_tag = "!!!"
    } else {
      this.props.color = colors["success"]
      mode_msg = "PROD MODE"
      mode_tag = "\*\*\*"
    }

    if (mode == "boot") {
      this.props.caption = { text: "Hello World" }
      this.props.title = {
        text: this.props["caption"].text,
        emoji: "🔼"
      }

      onlineness = "Online"
      readiness = "Ready"
    } else if (mode == "exit") {
      this.props.caption = { text: "Later, man!" },
      this.props.title = {
        text: this.props["caption"].text,
        emoji: "🔽"
      }
      this.props.color = colors["error"]
      mode_tag = "vvv"

      onlineness = "Offline"
      readiness = "Unready"
    }
    mode_msg = `${mode_tag} ${mode_msg} ${mode_tag}`

    let git_info = {
      user: "mysterypaintwo",
      repo: "rookbot"
    }
    git_info.root = `https://github.com/${git_info.user}/${git_info.repo}`

    // Get Branch
    try {
      if (fs.existsSync("./.git/HEAD")) {
        BRANCH = fs.readFileSync("./.git/HEAD","utf8").trim().match(/(?:\/)([^\/]*)$/)
        if (BRANCH && (BRANCH.length > 0)) {
          BRANCH = BRANCH[1]
        }
      } else if (process.env?.HOME == "/app") {
        BRANCH = "heroku"
      }
    } catch (err) {
      console.log(err)
    }

    // Get Commit
    try {
      let git_log_exec = shell.exec(
        "git log -1",
        { silent: true }
      )
      let git_log = git_log_exec.stdout.trim()
      let latest_commit = git_log.split("\n")[0]
      COMMIT = latest_commit.match(/^(?:[^\s]+)(?:[\s])([^\s]{7})/)
      if (COMMIT && (COMMIT.length > 0)) {
        COMMIT = COMMIT[1]
      }
    } catch (err) {
      console.log(err)
    }

    // Get Client User
    let user = client?.user

    let console_output = [
      "---"
    ]

    // Print Name & Version number
    console_output.push(
      (user ? user.username : "") +
      ` v${this.profile.PACKAGE.version} is ${onlineness}!`
    )
    if (!this?.props?.title) {
      this.props.title = { text: "" }
    }
    this.props.title.text = console_output[1]
    this.props.title.url = git_info.root

    // Print User
    if(this.DEV) {
      // DEV
      console_output.push(
        mode_msg,
        `Footer Tag:  "${this.profile.name}"`
      )
    } else {
      // PROD
      console_output.push(
        mode_msg,
        'Footer Tag:  "' + (user ? user.username : "") + '"'
      )
    }

    console_output.push(
      `Profile Key: '${this.profile.profileName}'`,
      `Branch Key:  <${BRANCH}>`,
      `Commit ID:   [${COMMIT}]`,
      `Bot is ${readiness}!`,
      ""
    )

    /**
     * console_output[1] = ---
     * console_output[2] = MODE
     * console_output[3] = Footer Tag
     * console_output[4] = Profile  Key
     * console_output[5] = Branch   Key
     * console_output[6] = Commit   ID
     * console_output[7] = Readiness
     */

    this.props.description =
      console_output[2]
        .replace(   // DEV
          /!!!/g,
          "🟧"
        )
        .replace(   // PROD
          /\*\*\*/g,
          "🟩"
        )
        .replace(   // EXIT
          /vvv/g,
          "🟥"
        )

    let offlineDateTime   = new Date()
    let launchedDateTime  = new Date(client.readyTimestamp)

    let server = {
      name: this?.channel?.guild.name ||
        interaction?.guild?.name ||
        client.guild.name ||
        "?",
      id: this?.channel?.guild.id ||
        interaction?.guild?.id ||
        client.guild.id ||
        process.env?.GUILD_ID,
      avatar: this?.channel?.guild.iconURL({ size: 128 }) ||
        interaction?.guild?.iconURL({ size: 128 }) ||
        client.guild.iconURL({ size: 128 }) ||
        ""
    }
    if (server?.id) {
      server.name = client?.guilds.cache.find(
        g => g.id === server.id
      )?.name || "?"
    }

    this.props["fields"] = [
      [
        // Client User
        {
          name: "Name",
          value:
            console_output[3].substring(console_output[3].indexOf(':') + 2)
              .replace(
                this.profile.name,
                this.profile?.discord?.user?.id ?
                `<@${this.profile.discord.user.id}>` :
                this.profile.name
              )
        },

        // Loaded Profile
        {
          name: "Profile",
          value:
            console_output[4].substring(console_output[4].indexOf(':') + 2)
              .replace(
                `'${this.profile.profileName}'`,
                `\`${this.profile.profileName}\``
              )
        }
      ],
      [
        // Server Name & Server ID
        {
          name: "Server Name",
          value: "?"
        },
        {
          name: "Server ID",
          value: "0"
        }
      ],
      [
        // Git Status
        {
          name: "Branch",
          value:
            console_output[5].substring(console_output[5].indexOf(':') + 2)
              .replace(
                `<${BRANCH}>`,
                `[\`${BRANCH}\`](${git_info.root}/tree/${BRANCH})`
              )
        },
        {
          name: "Commit",
          value:
            console_output[6].substring(console_output[6].indexOf(':') + 2)
              .replace(
                `[${COMMIT}]`,
                `[\`${COMMIT}\`](${git_info.root}/tree/${COMMIT})`
              )
        }
      ],
      [
        // Launch Time
        {
          name: "Launched",
          value: timeFormat(launchedDateTime.getTime(), true)
        }
      ]
    ]

    // If we're exiting
    if (mode == "exit") {
      this.props["fields"].push(
        [
          // Elapsed Time
          {
            name: "Elasped",
            value: timeConversion(offlineDateTime.getTime() - launchedDateTime.getTime())
          }
        ],
        [
          // Current Time
          {
            name: "Exited",
            value: timeFormat(offlineDateTime.getTime(), { showSeconds: true })
          }
        ]
      )
    }

    // Final Status
    this.props["fields"].push(
      [
        {
          name: "Status",
          value:
            user ?
              console_output[7]
                .replace(
                  "Bot",
                  `<@${user.id}>`
                ) :
                console_output[7]
        }
      ]
    )

    // Print to console
    console.log(console_output.join("\n"))

    // If we've got guilds
    if (client?.guilds) {
      // Cycle through guilds
      for (let [guildID, guildData] of client.guilds.cache) {
        // Get Client User
        let clientMember = null
        if (user) {
          clientMember = await guildData?.members?.fetch(user.id)
        }

        // If we're booting up
        if (mode == "boot" && clientMember) {
          // Get the current nickname
          let nick = clientMember?.nickname || clientMember.user.username
          // Get the prefix
          let prefix = client?.options?.defaultPrefix ||
            client?.options?.prefix ||
            client?.prefix ||
            "/ "
          // Check if we're missing a prefix in the nickname
          if (!(nick.includes(`[${prefix.trim()}] `))) {
            let regexp = /^[\[\(\{]([\S]+)[\}\)\]] /
            if (nick.match(regexp)) {
              nick = nick.replace(regexp, `[${prefix.trim()}] `)
            } else {
              // Add it if it's missing
              nick = `[${prefix.trim()}] ${nick}`
            }
          }
          // If we want to change it, do the thing
          if (nick != (clientMember?.nickname || clientMember.user.username)) {
            clientMember.setNickname(nick)
          }
        }

        let channelsJSONPath = path.join(
          __dirname,
          "..",
          "..",
          "dbs",
          guildID,
          "channels.json"
        )
        if (fs.existsSync(channelsJSONPath)) {
          // Find the Guild Channel to send the embed to
          let channelIDs = require(channelsJSONPath)
          if (!channelIDs) { this.error = true; continue; }

          let channelID = channelIDs["bot-salutations"]
          if (!channelID) { this.error = true; continue; }

          let guild = await client.guilds.cache.find(
            g => g.id === guildID
          )
          if (!guild) { this.error = true; continue; }

          let channel = await guild?.channels.cache.find(
            c => c.id === channelID
          )
          if (!channel) { this.error = true; continue; }

          // If we found the channel
          //  update the server info in the embed to reflect this one
          server = {
            type:   "guild",
            id:     guild.id,
            name:   guild?.name || "?",
            url:    "http://example.com/guild",
            avatar: guild.iconURL({ size: 128 })
          }

          this.props.fields[1][0].value = server?.name || "?"
          this.props.fields[1][1].value = `\`${server.id}\``

          this.props.entities.guild = server

          let printResult = await this.print_it(client, interaction, [ this.props ])

          if (printResult) {
            let this_package = { embeds: this.pages }

            await channel.send(this_package)
            this.null = true

            if (
              interaction &&
              interaction?.guild &&
              interaction?.guild?.id &&
              channel?.guild &&
              channel?.guild?.id &&
              interaction.guild.id === channel.guild.id &&
              typeof interaction.editReply === "function"
            ) {
              await interaction.editReply(
                {
                  content: `See ${channel}!`
                }
              )
            }
          }
        }
      }
    }

    if (mode == "boot") {
      return !this.error
    } else if (mode == "exit") {
      console.log(`!!! GOODBYE`)
      process.exit(1339)
    }
  }
}

exports.SalutationCommand = SalutationCommand
