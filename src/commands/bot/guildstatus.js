// @ts-nocheck

const { RookCommand } = require('../../classes/command/rcommand.class.js')
const timeFormat = require('../../utils/timeFormat.js')

module.exports = class GuildStatusCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "guildstatus",
      category: "bot",
      description: "Guild Status",
      flags: {
        test: "basic"
      }
    }
    let props = {}
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    // Entities
    let entities = {
      user: { name: interaction.user.displayName, avatar: interaction.user.avatarURL(), username: interaction.user.username },
      guild: { name: interaction.guild.name, avatar: interaction.guild.iconURL() }
    }
    // Players
    this.props.players = {
      user: entities.user,
      target: entities.guild
    }

    let serverBoostEmoji = await interaction.guild.emojis.cache.find(
      emoji => emoji.name === "serverboost2"
    )
    if (!(serverBoostEmoji)) {
      serverBoostEmoji = "[*]"
    }
    this.props.description = `***Guild Status for: ${interaction.guild.name}***`
    if (interaction.guild.features.length > 0) {
      this.props.description += "\n\n"
      this.props.description += "**Features**" + "\n" + '`'
      this.props.description += interaction.guild.features.join("`, `")
      this.props.description += '`'
    }

    this.props.fields = []

    if (interaction?.guild?.ownerId && interaction.guild.ownerId != "undefined") {
      // console.log(`Guild Owner: ${interaction.guild.ownerId}`)
      this.props.fields.push(
        [
          {
            name: "Owner",
            value: `<@${interaction.guild.ownerId}> (ID: \`${interaction.guild.ownerId}\`)`
          }
        ]
      )
    }

    if (interaction?.guild?.vanityURLCode && interaction.guild.vanityURLCode != "") {
      let vanityURL = `https://discord.gg/${interaction.guild.vanityURLCode}`
      this.props.fields.push(
        [
          {
            name: "Vanity URL",
            value: `[${interaction.guild.vanityURLCode}](${vanityURL} '${vanityURL}')`
          }
        ]
      )
    }

    let created = interaction.guild.createdTimestamp
    this.props.fields.push(
      [
        {
          name: "Members",
          value: interaction.guild.memberCount.toString(),
          inline: true
        },
        {
          name: "Server Level",
          value: interaction.guild.premiumTier == 0 ? `${interaction.guild.premiumTier}` : `${serverBoostEmoji}`.repeat(interaction.guild.premiumTier),
          inline: true
        },
        {
          name: "Partnered",
          value: interaction.guild.partnered ? "Yes" : "No",
          inline: true
        },
        {
          name: "Verified",
          value: interaction.guild.verified ? "Yes" : "No",
          inline: true
        }
      ],
      [
        {
          name: "Created",
          value: timeFormat(created)
        }
      ]
    )

    return !this.error
  }
}
