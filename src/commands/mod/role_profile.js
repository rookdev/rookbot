const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  codeBlock,
  inlineCode
} = require('discord.js')
const { ModCommand } = require('../../classes/command/modcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const dbFuncs = require('../../utils/db/dbFuncs')

module.exports = class RoleProfileCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "role_profile",
      category: "mod",
      description: "Apply a Role Profile to a member",
      options: [
        {
          name: "target-id",
          description: "The ID of the user you want to apply the role profile to.",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "profile",
          description: "The name of the profile to apply",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "reason",
          description: "Reason for applying the profile",
          type: ApplicationCommandOptionType.String
        }
      ],
      permissions: [ PermissionFlagsBits.Administrator ]
    }

    super(
      client,
      comprops,
      {}
    )
  }

  async action(client, interaction, coptions) {
    // FIXME: Temporary hack to not allow on Live Server
    //  Except Minnie because she knows what she's doing
    if (interaction) {
      if (interaction?.guild.id) {
        if (
          ([
            "1282788953052676177", // DoI Main
            // "365162015280594944", // Trident Esports Main
          ].includes(interaction.guild.id)) &&
          (interaction.user.username != "matrethewey")
        ) {
          this.error = true
          this.props.description = `${this.profile.emojis.fail} /${this.name} not ready for Live Server yet.`
          return false
        }
      }
    }

    // Get Guild ID
    const guildID = coptions["guild-id"] ?? interaction?.guild?.id
    // Get Guild
    const guild = await this.getCache(client, client, "guilds", guildID)
    if (!guild) {
      this.error = true
      this.props.description = `Guild [${guildiD}] not found`
      return false
    }

    // Get User Input
    const targetUserInput = coptions["target-id"]
    // Extract user ID from mention (if it's a mention)
    const targetUserId = targetUserInput.replace(/[<@!>]/g, '')  // Remove <@>, <@!>, and >
    // Get Reason
    const reason = coptions["reason"] ?? `${this.profile.emojis.fail} No reason provided`
    // Get Role Profile
    const profileName = coptions["profile"] ?? ""

    let dbRes = await dbFuncs.getDB(
      guildID,
      "roleProfiles"
    )
    let roleProfiles = dbRes[0]
    let messages = dbRes[1]

    if (!roleProfiles) {
      this.error = true
      this.props.description = `Role Profiles not found for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })}`
      return false
    }

    if (roleProfiles.length <= 0) {
      this.error = true
      this.props.description `Role Profiles for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })} too short`
      return false
    }

    const roleProfile = roleProfiles[profileName]

    if (!roleProfile) {
      this.error = true
      this.props.description = `Role Profile '${profileName}' not found for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })}`
      return false
    }

    const member = await this.getCache(client, guild, "members", targetUserId)

    if (!member) {
      this.error = true
      this.props.description = `Member [${inlineCode(targetUserId)}] not found in ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })}`
      return false
    }

    this.props.description = [
      `Applying '${profileName}' for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })} to ${mentionFuncs.userMention(member.id, { showID: true })}`,
      codeBlock(JSON.stringify(roleProfiles[profileName]))
    ]
    let success = false

    // Add
    if (roleProfile?.add?.length > 0) {
      success = false
      let addRoles = roleProfile.add
      if (typeof addRoles != "object") {
        addRoles = [ addRoles ]
      }
      for (let role of addRoles) {
        this.messages.push(`Adding '${role}'`)
        success = await this.add_role(
          interaction,
          member,
          role
        )
      }
    }

    // Remove
    if (roleProfile?.remove?.length > 0) {
      success = false
      let removeRoles = roleProfile.remove
      if (typeof removeRoles != "object") {
        removeRoles = [ removeRoles ]
      }
      for (let role of removeRoles) {
        this.messages.push(`Removing '${role}'`)
        success = await this.remove_role(
          interaction,
          member,
          role
        )
      }
    }

    // Only
    if (roleProfile?.only?.length > 0) {
      success = false
      let roles = roleProfile.only
      if (typeof roles != "object") {
        roles = [ roles ]
      }
      let newRoles = []
      for (let roleName of roles) {
        newRoles.push(
          await this.getCache(
            client, interaction.guild, "roles", roleName
          ).id
        )
      }
      this.messages.push(`Setting ${JSON.stringify(newRoles)}`)
      success = await member.roles.set(newRoles)
    }

    if (success && roleProfile?.prefix && roleProfile.prefix != "") {
      if (!member.displayName.includes(roleProfile.prefix)) {
        let oldName = member.displayName
        let splitter = roleProfile.prefix.trim()
        this.messages.push(splitter)
        splitter = splitter.substring(splitter.length - 1).trim()
        this.messages.push(splitter)
        if (oldName.includes(splitter)) {
          oldName = oldName.substring(oldName.indexOf(splitter) + 1).trim()
        }
        let newName = `${roleProfile.prefix}${oldName}`
        this.messages.push(`Updating '${oldName}' to '${newName}'`)
        success = await member.setNickname(newName)
      }
    }
  }
}
