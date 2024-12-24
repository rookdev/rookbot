// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
const { RookCommand } = require('../../classes/command/rcommand.class.js')
const timeFormat = require('../../utils/timeFormat.js')

module.exports = class UserInfoCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "userinfo",
      category: "misc",
      description: "Displays data of the mentioned user",
      flags: { target: "required" },
      options: [
        {
          name: "target-id",
          description: "The user you want to see",
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ],
      testOptions: [
        { "target-id": "263968998645956608" },  // Minnie
        { "target-id": "1111517386588307536" }, // castle
        { "target-id": "1307416505171968011" }, // rookbot (Minnie)
        { "target-id": "942642507488034841" },  // TridentBot
        { "target-id": "375068222057086976" }   // DoI Dev
      ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async action(client, interaction, coptions) {
    const targetUserInput = coptions['target-id']

    // Extract user ID from mention (if it's a mention)
    const targetUserId = targetUserInput.replace(/[<@!>]/g, '')  // Remove <@>, <@!>, and >

    let targetMember = null
    try {
      // Fetch the GuildMember object to access server-specific info
      targetMember = await interaction.guild.members.fetch(targetUserId)
    } catch(e) {
      this.error = true
      this.props = {
        title: { text: "Error" },
        description: `<@${targetUserId}> (ID: \`${targetUserId}\`) not found in '${interaction.guild.name}'!`
      }
      return !this.error
    }

    // Access the server nickname, fallback to username
    const targetUserName = targetMember.displayName ||
      targetMember.user.tag ||
      targetMember.user.username

    // Get the user's avatar URL
    const avatarURL = targetMember.displayAvatarURL({ size: 1024 })

    let fields = [
      // Username
      [
        {
          name: "Username",
          value: `\`${targetMember.user.tag}\`` +
          "(ID: " + `\`${targetMember.id}\`` + ")"
        }
      ],

      // Created
      [
        {
          name: "Created",
          value: timeFormat(targetMember.user.createdTimestamp)
        }
      ],

      // Joined
      [
        {
          name: "Joined",
          value: timeFormat(targetMember.joinedTimestamp)
        }
      ]
    ]

    let botActions = {
      "🤖": targetMember.user.bot,
      "🛠": targetMember.manageable,
      "🔨": targetMember.moderatable
    }
    let botCan = ""
    let botCant = ""
    for (let botAction of Object.entries(botActions)) {
      if (botAction[1]) {
        botCan += botAction[0]
      } else {
        botCant += botAction[0]
      }
    }
    fields.push(
      [
        {
          name: "Bot Actions",
          value: "🟩" + botCan + "\n" +
            "🟥" + botCant
        }
      ]
    )

    this.props = {
      caption: {
        text: targetUserName,
        url: avatarURL
      },
      color: targetMember.user.hexAccentColor,
      fields: fields,
      image: { image: avatarURL }
    }

    return !this.error
  }
}
