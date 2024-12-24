// @ts-nocheck

const {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  Role
} = require('discord.js')
const { AdminCommand } = require('./admincommand.class')
const { RookEmbed } = require('../embed/rembed.class')
const timeConversion = require('../../utils/timeConversion')
const timeFormat = require('../../utils/timeFormat')
const colors = require('../../dbs/colors.json')
const path = require('path')
const fs = require('fs')

function isNumeric(n) {
  let isaN      = !isNaN(n)
  let isBool    = typeof n === "boolean"
  let isStr     = typeof n === "string"
  let isNumStr  = (
    isStr &&
    ((n.replace(/\D/g, '') + "") == (n + ""))
  )

  return (isaN || isNumStr) && !isBool
}

// Multiple messages

/**
 * @class
 * @classdesc Build a Command for Mods-only
 * @this {ModCommand}
 * @extends {AdminCommand}
 * @public
 */
class ModCommand extends AdminCommand {
  constructor(client, comprops, props) {
    // If we don't have UserPermissions defined
    if (!comprops?.permissionsRequired) {
      // Default to KickMembers
      comprops.permissionsRequired = [ PermissionFlagsBits.KickMembers ]
    }
    // If we don't have BotPermissions defined
    if (!comprops?.botPermssions) {
      // Default to KickMembers
      comprops.botPermssions = [ PermissionFlagsBits.KickMembers ]
    }
    // Category: Mod
    comprops.access = comprops?.access ? comprops.access : "Mod"

    // Create parent object
    super(
      client,
      {...comprops},
      {...props}
    )
    this.ephemeral = true
  }

  // declare props: import('../../types/embed').EmbedProps

  /**
   * Add/Remove roles
   *
   * @param {ChatInputCommandInteraction} interaction Interaction that called the command
   * @param {GuildMember}                 user        User that we're modifying
   * @param {Object.<string, string>}     roles       Roles that we're adjusting
   * @param {string}                      [reason]    Reason?
   */
  async adjust_roles(
    interaction,
    user,
    // @ts-ignore
    // roles: Object<[x:string], string | number>,
    roles,
    reason
  ) {

    console.log("Adjust Roles:",user.displayName,roles)
    if (!user) {
      this.error = true
      this.props.description = "No member loaded."
      return
    }

    if (!roles) {
      this.error = true
      this.props.description = "No roles provided."
      return
    }

    // let addRole: Role | number | string | undefined = 0
    // let remRole: Role | number | string | undefined = 0
    let addRole = 0
    let remRole = 0
    let matches = null
    let success = false

    if (Object.keys(roles).includes("add")) {
      addRole = roles.add
      matches = (addRole + "").match(/([\d]+)/)
      if (
        (
          matches ||
          (parseInt(addRole + "") == addRole) ||
          isNumeric(addRole)
        ) &&
        // @ts-ignore
        addRole != 0
      ) {
        if (matches) {
          addRole = matches[1]
        }
        addRole = await interaction.guild?.roles.cache.find(
          role => role.id === addRole
        )
      } else {
        addRole = await interaction.guild?.roles.cache.find(
          role => role.name === addRole
        )
      }
      // @ts-ignore
      if (addRole && addRole != 0) {
        try {
          await user.roles.add(addRole.id)
          success = true
        } catch(e) {
          console.log(e)
          success = false
        }
      }
    }
    if (Object.keys(roles).includes("remove")) {
      remRole = roles.remove
      matches = (remRole + "").match(/([\d]+)/)
      if (
        (
          matches ||
          (parseInt(remRole + "") == remRole) ||
          isNumeric(remRole)
        ) &&
        // @ts-ignore
        remRole != 0
      ) {
        if (matches) {
          remRole = matches[1]
        }
        remRole = await interaction.guild?.roles.cache.find(
          role => role.id === remRole
        )
      } else {
        remRole = await interaction.guild?.roles.cache.find(
          role => role.name === remRole
        )
      }
      // @ts-ignore
      if (remRole && remRole != 0) {
        try {
          await user.roles.remove(remRole.id)
          success = true
        } catch(e) {
          console.log(e)
          success = false
        }
      }
    }

    if (addRole == 0 && remRole == 0) {
      this.error = true
      this.props.description = "No roles found."
      return false
    }

    return success
  }

  /**
   * Add role to user
   *
   * @param {ChatInputCommandInteraction}         interaction Interaction that called the command
   * @param {GuildMember}                         user        User that we're modifying
   * @param {import('discord.js').RoleResolvable} role        Role that we're adding
   * @param {string}                              [reason]    Reason?
   */
  async add_role(interaction, user, role, reason) {
    return await this.adjust_roles(
      interaction,
      user,
      { add: role },
      reason
    )
  }
  /**
   * Remove role from user
   *
   * @param {ChatInputCommandInteraction}         interaction Interaction that called the command
   * @param {GuildMember}                         user        User that we're modifying
   * @param {import('discord.js').RoleResolvable} role        Role that we're removing
   * @param {string}                              [reason]    Reason?
   */
  async remove_role(interaction, user, role, reason) {
    return await this.adjust_roles(
      interaction,
      user,
      { remove: role },
      reason
    )
  }

  /**
   * Apply Voice Roles (un/mute) to User
   *
   * @param {ChatInputCommandInteraction} interaction Interaction that called the command
   * @param {GuildMember}                 user        User that we're modifying
   * @param {string}                      voice       Un/Mute?
   * @param {string}                      [reason]    Reason?
   */
  async voice_user(interaction, user, voice, reason) {
    let success = false
    // Member Role Name
    let MEMBER_ROLE = this?.ROLES?.member ? this.ROLES.member[0]  : null
    // Muted Role Name
    let MUTED_ROLE  = this?.ROLES?.muted  ? this.ROLES.muted[0]   : null

    // Member Role ID
    let MEMBER_ID   = interaction.options.getString("target-id")  || null
    // Muted Role ID
    let MUTED_ID    = interaction.options.getString("muted-role-id")   || null

    if (!this.DEV) {
      let mainRole = MEMBER_ROLE  || MEMBER_ID
      let muteRole = MUTED_ROLE   || MUTED_ID

      // If no Member Role
      if (!mainRole) {
        this.error = true
        this.props.description = `${MEMBER_ROLE} Member Role not found in server.`
        return false
      }
      // If no Muted Role
      if (!muteRole) {
        this.error = true
        this.props.description = `${MUTED_ROLE} Muted Role not found in server.`
        return false
      }

      let roles = {
        add:    0,
        remove: 0
      }
      // If muting
      if (voice == "mute") {
        // Remove Member
        // Add    Muted
        roles = {
          add:    muteRole,
          remove: mainRole
        }
      } else if (voice == "unmute") {
        // If unmuting
        // Remove Muted
        // Add    Member
        roles = {
          add:    mainRole,
          remove: muteRole
        }
      }
      success = await this.adjust_roles(
        interaction,
        user,
        roles,
        reason
      ) || false
      this.props.description = `<@${user.id}> has been ${voice}d`
    } else {
      this.props.description = `<@${user.id}> *would be* **${voice}d** if this wasn't in DEV Mode`
    }

    return success
  }
  /**
   * Mute a User
   *
   * @param {ChatInputCommandInteraction} interaction Interaction that called the command
   * @param {GuildMember}                 user        User that we're modifying
   * @param {string}                      [reason]    Reason?
   */
  async mute_user(interaction, user, reason) {
    return await this.voice_user(interaction, user, "mute", reason)
  }
  /**
   * Unmute a User
   *
   * @param {ChatInputCommandInteraction} interaction Interaction that called the command
   * @param {GuildMember}                 user        User that we're modifying
   * @param {string}                      [reason]    Reason?
   */
  async unmute_user(interaction, user, reason) {
    return await this.voice_user(interaction, user, "unmute", reason)
  }

  async action(client, interaction, coptions) {
    if (interaction) {
      if (interaction?.guild.id) {
        if (interaction.guild.id === "1282788953052676177") {
          this.error = true
          this.props.description = `/${this.name} not ready for Live Server yet.`
          return false
        }
      }
    }

    let lastingError

    // Get Guild ID
    const guildID = interaction.guild.id
    // Get Guild Channels
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    // Get User Input
    const targetUserInput = coptions["target-id"];
    // Get Reason
    const reason = coptions["reason"] || 'No reason provided';
    // Get Role
    const role = interaction.options?.getString("role")?.replace(/[<@&>]/g, "") || ""
    // Get Timeout Duration
    let duration = interaction.options?.getInteger("duration-seconds") || 0
    let durationSeconds = 0
    let durationMilliseconds = 0
    if (duration) {
      durationSeconds = Math.abs(duration)
      durationMilliseconds = durationSeconds * 1000
    }
    let now = new Date()
    let timeoutUntil = new Date(now.getTime() + durationMilliseconds)

    let props = {
      public: {},
      dm:     {},
      mod:    {},
      log:    {}
    }
    let embeds = {}

    let pretty_name = this.name.split("_").map(x => x.ucfirst()).join(" ")

    // EMOJI for the action
    let emoji = ""
    // TENSE for the action
    let tenses = {
      past:     (pretty_name.endsWith("e") ? pretty_name.substring(0, pretty_name.length - 1) : pretty_name) + "ed",
      present:  pretty_name,
      future:   pretty_name,
      active:   (pretty_name.endsWith("e") ? pretty_name.substring(0, pretty_name.length - 1) : pretty_name) + "ing"
    }
    switch(pretty_name) {
      case "Unban":
        tenses.past = "unbanned"
        tenses.active = tenses.past.replace("ed","ing")
        emoji = "🪃"
        break
      case "Ban":
        tenses.past = "banned"
        tenses.active = tenses.past.replace("ed","ing")
        emoji = "🔨"
        break
      case "Kick":
        emoji = "👟💥🏃‍♂️"
        break
      case "Unmute":
        emoji = "🔊"
        break
      case "Mute":
        emoji = "🔈"
        break
      case "Role Add":
        emoji = "➕"
        break
      case "Role Remove":
        emoji = "➖"
        break
      case "Timeout":
        tenses.past = "timed out"
        tenses.active = "timing out"
        emoji = "⏰"
        break
      case "Warn":
        emoji = "⚠️"
        break
    }

    // Extract user ID from mention (if it's a mention)
    const targetUserId = targetUserInput.replace(/[<@!>]/g, '');  // Remove <@>, <@!>, and >
    if(
      [
        "ban",
        "kick",
        "mute",
        "timeout",
        "unban",
        "unmute"
      ].includes(this.name)
    ) {
      if(targetUserInput != targetUserId) {
        props.mod.error = true
        props.mod.ephemeral = true
        props.mod.description = [
          `Can't **${this.name}** a mention! Must use user ID!`,
          `ID: \`${targetUserId}\``
        ]
        this.props = props.mod
        return false
      }
    }

    // Get the user to be ACTIONed
    let targetUser;
    try {
      targetUser = await client.users.fetch(targetUserId);
    } catch (error) {
      props.mod.error = true
      props.mod.description = "User not found."
      this.props = props.mod
      return false
    }

    // Get the guild member (to fetch nickname if present)
    const guildMember = interaction.guild.members.cache.get(targetUserId);
    const user = guildMember?.user || targetUser

    // Attempt to ACTION the user
    let success = false
    try {
      // ACTION the user
      if (!this.DEV) {
        switch(this.name) {
          case "role_add":
            success = await this.add_role(
              interaction,
              guildMember,
              role
            ) || false
            break
          case "role_remove":
            success = await this.remove_role(
              interaction,
              guildMember,
              role
            ) || false
            break
          case "ban":
            success = await interaction.guild.members.ban(
              targetUserId, { reason }
            )
            break
          case "kick":
            success = await interaction.guild.members.kick(
              targetUserId, { reason }
            )
            break
          case "mute":
            success = await this.mute_user(
              interaction,
              guildMember,
              reason
            ) || false
            break
          case "timeout":
            success = await guildMember.timeout(
              durationMilliseconds,
              reason
            )
            break
          case "unban":
            success = await interaction.guild.members.unban(
              targetUserId
            )
            break
          case "unmute":
            success = await this.unmute_user(
              interaction,
              guildMember,
              reason
            ) || false
            break
          case "warn":
            success = true
            // success = await interaction.guild.members.warn(
            //   targetUserId
            // )
            break
        }
      } else {
        success = true
      }

      // Determine the name to display (use nickname if available, otherwise default to tag or username)
      const targetUserName = guildMember?.nickname || targetUser.username;

      if (success) {
        // Public ModPost for ACTION
        props.public.color = colors["success"]
        props.public.title = {
          emoji: "🟢",
          text: "[ModPost] Success!"
        }
        props.public.description = [
          (this.DEV ? "DEV: " : "") +
          `User **${targetUserName}** has been **${tenses.past}**`,
          "(" +
          // `ID: \`${targetUserId}\`; ` +  // Don't add userID to ModPost
          (role != "" ? `Role: ${role}; Reason: ` : "") +
          reason +
          ")"
        ]
        embeds.public = await new RookEmbed(client, props.public)
        interaction.channel.send(
          {
            embeds: [ embeds.public ]
          }
        )
        this.null = true
        this.props.null = true
        console.log(`/${this.name}: ModPost`)
      }

      if (success && (!this.DEV || true)) {
        // DM post for ACTION
        try {
          let dm_desc = `You have been ${tenses.past} from the ${interaction.guild.name} server. ` +
          `(` +
          (role != "" ? `Role: ${role}; Reason: ` : "") +
          (durationSeconds != 0 ? `Duration: ${timeConversion(durationMilliseconds)}; Until: ${timeFormat(timeoutUntil.getTime())}; Reason: ` : "") +
          reason +
          `)`
          if (
            [
              "mute",
              "timeout",
              "unmute",
              "warn"
            ].includes(this.name)
          ) {
            dm_desc = dm_desc.replace(" from ", " by staff in ")
          }
          props.dm = {
            color: colors["bad"],
            title: {
              emoji: "⚠️",
              text: (this.DEV ? "[DM] " : "") + pretty_name
            },
            description: dm_desc
          }
          embeds.dm = await new RookEmbed(client, props.dm)
          if (!this.DEV) {
            await targetUser.send(
              {
                embeds: [ embeds.dm ]
              }
            )
          }
          console.log(`/${this.name}: DM Post`)

          // Reply to Mod for DM about ACTION
          this.ephemeral = true
          props.mod = {
            color: colors["success"],
            title: {
              emoji: "🟢",
              text: "[YouPost] Success!"
            },
            ephemeral: true
          }
          // Don't link user
          if (["ban","unban","kick"].includes(this.name)) {
            props.mod.description = [
              `✅ User **${targetUserName}** successfully **${tenses.past}** via DMs!`,
            ]
          } else {
            // Do link user
            props.mod.description = [
              `✅ User <@${targetUserId}> successfully **${tenses.past}** via DMs!`,
            ]
          }
          props.mod.description.push(
            "",
            `Message: ${props.dm.description}`
          )
          embeds.mod = await new RookEmbed(client, props.mod)
          interaction.followUp(
            {
              embeds: [ embeds.mod ],
              flags: MessageFlags.Ephemeral
            }
          )
          console.log(`/${this.name}: YouPost`)
        } catch (dmError) {
          // Reply to Mod about failed DM for ACTION
          this.ephemeral = true
          console.log(`Failed to DM user: ${dmError.message}`);
          props.mod = {
            color: colors["red"],
            title: { text: "[YouPost] Error" },
            description: [
              `I couldn't send the DM to the user (ID: ${targetUserId}).`,
              `They might have DMs disabled.`
            ],
            ephemeral: true
          }
          embeds.mod = await new RookEmbed(client, props.mod)
          interaction.followUp(
            {
              embeds: [ embeds.mod ],
              flags: MessageFlags.Ephemeral
            }
          )
        }
      }

      if (success && (!this.DEV || true)) {
        // LogPost for ACTION
        let log_type = "logging"
        let log_check = `logging-${this.name}`
        if (guildChannels[log_check]) {
          log_type = log_check
        }
        const logsChannel = await this.getChannel(client, interaction, log_type);
        if (logsChannel) {
          if(this.DEV) {
            emoji = "[DEV]" + emoji
          }
          props.log = {
            color: this.name == "unban" ? colors["good"] : colors["bad"],
            title: {
              emoji: emoji,
              text: "[Log] User " + tenses.past.ucfirst()
            },
            fields: [
              [
                { name: 'User ' + tenses.past.ucfirst(),  value: `${targetUser}\n(ID: \`${targetUserId}\`)` },
                { name: tenses.past.ucfirst() + ' By',    value: `${interaction.user}\n(ID: \`${interaction.user.id}\`)` }
              ]
            ]
          }
          if (
            [
              "ban",
              "kick",
              "mute",
              "timeout",
              "warn"
            ].includes(this.name)
          ) {
            props.log.fields.push(
              [
                {
                  name: "Reason",
                  value: reason
                }
              ]
            )
          }
          embeds.log = await new RookEmbed(client, props.log)
          logsChannel.send(
            {
              embeds: [ embeds.log ]
            }
          )
          console.log(`/${this.name}: LogPost`)
        } else {
          console.log("Logs channel not found.")
        }

        // LogFile for ACTION
        let logFilePath = path.join(
          __dirname,
          "..",
          "..",
          "botlogs",
          ((this.DEV ? "DEV" : "") + "member" + pretty_name.replace(" ", "") + "s.log")
        )
        let logEntry = [
          `[${now.toISOString()}]`,
          `User:     ${user.tag} (ID: ${user.id})`,
          `Actor:    ${interaction.user.tag} (ID: ${interaction.user.id})`,
          `Action:   ${tenses.past.ucfirst()}`,
          `Guild:    ${interaction.guild.name} (ID: ${interaction.guild.id})`,
        ]
        if (durationSeconds != 0) {
          logEntry.push(
            `Seconds:  ${durationSeconds} seconds`,
            `Duration: ${timeConversion(durationMilliseconds)}`,
            `Until:    ${timeoutUntil.toISOString()}`
          )
        }
        if (role != "") {
          logEntry.push(
            `Role:     ${role}`
          )
        }
        logEntry.push(
          `Reason:   ${reason}`,
          '--------------------------------'
        )
        fs.appendFileSync(logFilePath, logEntry.join("\n") + "\n", "utf8")
        console.log(`/${this.name}: LogFile`)
      }
    } catch (error) {
      lastingError = error
      success = false
    }

    if (!success) {
      // Reply to Mod if error for ACTION
      this.ephemeral = true
      let msg = `There was an error when ${tenses.active}`
      if (lastingError) {
        msg += `: ${lastingError.stack}`
      }
      console.log(msg)
      props.mod.title = { text: "[YouPost]" }
      props.mod.error = true
      props.mod.ephemeral = true
      props.mod.description = `I couldn't ${tenses.present} ${targetUser} (ID: \`${targetUserId}\`).`
      embeds.mod = await new RookEmbed(client, props.mod)
      await this.send(
        client,
        interaction,
        [ embeds.mod ]
      )
      this.null = true
    }

    return success && !lastingError
  }

  async build(client, interaction, coptions={}) {
    console.log(`/${this.name}: Mod Build`)

    // Get list of roles
    this.ROLES = JSON.parse(fs.readFileSync(`./src/dbs/${interaction.guild.id}/roles.json`, "utf8"))
    // Get Mod roles
    let APPROVED_ROLES = this.ROLES["admin"].concat(this.ROLES["mod"])
    // Bail if we don't have intended Approved Roles data
    if (!APPROVED_ROLES) {
      this.error = true
      this.props.description = "Failed to get Approved Roles."
      return false
    }

    // Bail if member doesn't have Approved Roles
    if (!(await interaction.member.roles.cache.some(r => APPROVED_ROLES.includes(r.name)))) {
      this.error = true
      this.props.description = this.errors.modOnly
      this.props.fields = []
      this.props.footer = { text: "" }
      this.props.image = { image: "" }
      return !this.error
    }

    if (!(this.error)) {
      for (let option of this.options) {
        if ((!(coptions.hasOwnProperty(option.name)))) {
          let thisOption = interaction.options.get(option.name)
          if (thisOption) {
            coptions[option.name] = thisOption.value
          }
        }
      }
    }

    let actionResult = await this.action(client, interaction, coptions)

    return actionResult && !this.error
  }
}

exports.ModCommand = ModCommand
