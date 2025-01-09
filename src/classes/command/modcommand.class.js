// @ts-nocheck

/**
 * Discord Stuff
 *  Chat Slash Command Interaction
 *  Guild Member
 *  Message Flags
 *  Permission Flags
 *  Role Object
 *  Formatters
 *   codeBlock
 *   inlineCode
 *   bold
 *   italic
 *   userMention
 */
const {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  Role,
  codeBlock,
  inlineCode,
  bold,
  italic,
  userMention
} = require('discord.js')
// Admin Command
const { AdminCommand } = require('./admincommand.class')
// Base Rook Embed
const { RookEmbed } = require('../embed/rembed.class')
// Convert milliseconds to d/h/m/s
const timeConversion = require('../../utils/timeConversion')
// Use Discord HammerTime
const timeFormat = require('../../utils/timeFormat')
const numFuncs = require('../../utils/numFuncs')
const path = require('path')  // Easy filepath management
const fs = require('fs')      // Filesystem manipulation

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
    if (!comprops?.userPermissions) {
      // Default to KickMembers
      comprops.userPermissions = [ PermissionFlagsBits.KickMembers ]
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
   * @param {Object.<string, import('discord.js').RoleResolvable | number | string>}     roles       Roles that we're adjusting
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

    // Bail if we don't have a User object
    if (!user) {
      this.error = true
      this.props.description = `${this.profile.emojis.fail} No member loaded.`
      return
    }

    // Bail if we don't have any roles to set
    if (!roles) {
      this.error = true
      this.props.description = `${this.profile.emojis.fail} No roles provided.`
      return
    }

    // let addRole: Role | number | string | undefined = 0
    // let remRole: Role | number | string | undefined = 0
    let addRole = 0
    let remRole = 0
    let matches = null
    let success = false

    // If we're adding a Role
    if (Object.keys(roles).includes("add")) {
      addRole = roles.add
      // Get the number
      matches = (addRole + "").match(/([\d]+)/)
      // If we found something and it's a number
      if (
        (
          matches ||
          // @ts-ignore
          (parseInt(addRole + "") == addRole) ||
          numFuncs.myIsNumeric(addRole)
        ) &&
        // @ts-ignore
        addRole != 0
      ) {
        // Search for Role object by RoleID
        if (matches) {
          addRole = matches[1]
        }
        addRole = await interaction.guild.roles.fetch(addRole)
      } else {
        // Search for the Role object by Role Name
        addRole = await interaction.guild.roles.cache.find(
          role => role.name === addRole
        )
      }
      // Add the Role
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

    // If we're removing a Role
    if (Object.keys(roles).includes("remove")) {
      remRole = roles.remove
      // Get the number
      matches = (remRole + "").match(/([\d]+)/)
      // If we found something and it's a number
      if (
        (
          matches ||
          // @ts-ignore
          (parseInt(remRole + "") == remRole) ||
          numFuncs.myIsNumeric(remRole)
        ) &&
        // @ts-ignore
        remRole != 0
      ) {
        // Search for the Role object by RoleID
        if (matches) {
          remRole = matches[1]
        }
        remRole = await interaction.guild.roles.fetch(remRole)
      } else {
        // Search for the Role object by Role Name
        remRole = await interaction.guild.roles.cache.find(
          role => role.name === remRole
        )
      }
      // Remove the Role
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

    // Bail, if after all that, we failed to find a proper Role
    if (addRole == 0 && remRole == 0) {
      this.error = true
      this.props.description = `${this.profile.emojis.fail} No roles found.`
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
    let MEMBER_ID   = interaction.options.getString("target-id")      ?? null
    // Muted Role ID
    let MUTED_ID    = interaction.options.getString("muted-role-id")  ?? null

    if (!this.DEV) {
      let mainRole = MEMBER_ROLE  ?? MEMBER_ID  // Member Role
      let muteRole = MUTED_ROLE   ?? MUTED_ID   // Muted Role

      // Bail if no Member Role
      if (!mainRole) {
        this.error = true
        this.props.description = `${this.profile.emojis.fail} ${MEMBER_ROLE} Member Role not found in server.`
        return false
      }
      // Bail if no Muted Role
      if (!muteRole) {
        this.error = true
        this.props.description = `${this.profile.emojis.fail} ${MUTED_ROLE} Muted Role not found in server.`
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
      this.props.description = `${this.profile.emojis.prod} ${userMention(user.id)} has been ${voice}d`
    } else {
      this.props.description = `${this.profile.emojis.dev} ${userMention(user.id)} ${italic('would be')} ${bold(voice + 'd')} if this wasn't in DEV Mode`
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
    // FIXME: Temporary hack to not allow on Live Server
    //  Except Minnie because she knows what she's doing
    if (interaction) {
      if (interaction?.guild.id) {
        if (
          ([
            "1282788953052676177", // DoI Main
            "365162015280594944", // Trident Esports Main
          ].includes(interaction.guild.id)) &&
          (interaction.user.username != "matrethewey")
        ) {
          this.error = true
          this.props.description = `${this.profile.emojis.fail} /${this.name} not ready for Live Server yet.`
          return false
        }
      }
    }

    let lastingError

    // Get Guild ID
    const guildID = coptions["guild-id"] ?? interaction?.guild?.id
    // Get Guild Channels
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    // Get User Input
    const targetUserInput = coptions["target-id"]
    // Get Reason
    const reason = coptions["reason"] ?? `${this.profile.emojis.fail} No reason provided`
    // Get Role
    const role = coptions["role"]?.replace(/[<@&>]/g, "") ?? ""
    // Get Timeout Duration
    let duration = coptions["duration-seconds"] ?? 0
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
    const targetUserId = targetUserInput.replace(/[<@!>]/g, '')  // Remove <@>, <@!>, and >

    // If we're doing something that Discord actually does something with
    //  require a User ID and don't allow a Mention
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
          `${this.profile.emojis.fail} Can't ${bold(this.name)} a mention! Must use user ID!`,
          codeBlock(`ID: ${targetUserId}`)
        ]
        this.props = props.mod
        return false
      }
    }

    // Get the user to be ACTIONed
    let targetUser
    try {
      targetUser = await client.users.fetch(targetUserId)
    } catch (error) {
      props.mod.error = true
      props.mod.description = `${this.profile.emojis.fail} User not found.`
      this.props = props.mod
      return false
    }

    // Get the guild member (to fetch nickname if present)
    const guildMember = await interaction.guild.members.fetch(targetUserId)
    const user = guildMember?.user ?? targetUser

    // Check Editable
    let editable = this.botCanEdit(client, guildMember)

    // Attempt to ACTION the user
    let success = false
    try {
      // ACTION the user
      if (!this.DEV) {
        switch(this.name) {
          // Role Add
          case "role_add":
            success = await this.add_role(
              interaction,
              guildMember,
              role
            ) || false
            break

          // Role Remove
          case "role_remove":
            success = await this.remove_role(
              interaction,
              guildMember,
              role
            ) || false
            break

          // Ban
          case "ban":
            let banPurgeDays = coptions['delete-days'] ?? 0
            let banOptions = { reason: reason }
            if (banPurgeDays) {
              SEC = 1000
              MIN = SEC * 60
              HR  = MIN * 60
              DAY = HR  * 24
              banOptions.deleteMessageSeconds = banPurgeDays * DAY
            }
            success = await interaction.guild.members.ban(
              targetUserId,
              banOptions
            )
            break

          // Kick
          case "kick":
            success = await interaction.guild.members.kick(
              targetUserId, { reason }
            )
            break

          // Mute
          case "mute":
            success = await this.mute_user(
              interaction,
              guildMember,
              reason
            ) || false
            break

          // Timeout
          case "timeout":
            success = await guildMember.timeout(
              durationMilliseconds,
              reason
            )
            break

          // Unban
          case "unban":
            success = await interaction.guild.members.unban(
              targetUserId
            )
            break

          // Unmute
          case "unmute":
            success = await this.unmute_user(
              interaction,
              guildMember,
              reason
            ) || false
            break

          // Warn
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
      const targetUserName = guildMember?.nickname ?? targetUser.username
      // let printResult: boolean | Array<string> = false
      let printResult = false

      if (success) {
        // Public ModPost for ACTION
        props.public.color = this.profile.colors.success
        props.public.title = {
          emoji: this.profile.emojis.good,
          text: "[ModPost] Success!"
        }
        props.public.playerTypes = {
          user: "bot",
          target: "guild"
        }
        props.public.description = [
          (this.DEV ? "DEV: " : "") +
          `User ${bold(targetUserName)} has been ${bold(tenses.past)}`,
          "(" +
          // `ID: ${inlineCode(targetUserId)}; ` +  // Don't add userID to ModPost
          (role != "" ? `Role: ${role}; Reason: ` : "") +
          reason +
          ")"
        ]
        printResult = await this.print_it(client, interaction, [ props.public ])
        embeds.public = this.pages[0]
        this.pages = []
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
            color: this.profile.colors.warning,
            title: {
              emoji: this.profile.emojis.warn,
              text: (this.DEV ? "[DM] " : "") + pretty_name
            },
            playerTypes: {
              user: "bot",
              target: "guild"
            },
            description: dm_desc
          }
          printResult = await this.print_it(client, interaction, [ props.dm ])
          embeds.dm = this.pages[0]
          this.pages = []
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
            color: this.profile.colors.success,
            title: {
              emoji: this.profile.emojis.good,
              text: "[YouPost] Success!"
            },
            playerTypes: {
              user: "bot",
              target: "target"
            },
            entities: {
              target: {
                name: targetUser.displayName,
                avatar: targetUser.displayAvatarURL({ size: Math.pow(2, 7) })
              }
            },
            ephemeral: true
          }
          // Do link user
          props.mod.description = [
            `${this.profile.emojis.check} User ${userMention(targetUserId)} successfully ${bold(tenses.past)} via DMs!`,
          ]
          props.mod.description.push(
            "",
            `Message: ${props.dm.description}`
          )
          printResult = await this.print_it(client, interaction, [ props.mod ])
          embeds.mod = this.pages[0]
          this.pages = []
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
          console.log(`${this.profile.emojis.fail} Failed to DM user: ${dmError.message}`)
          props.mod = {
            color: this.profile.colors.error,
            title: { text: "[YouPost] Error" },
            description: [
              `${this.profile.emojis.fail} I couldn't send the DM to the user [${targetUserId}].`,
              `They might have DMs disabled.`
            ],
            ephemeral: true
          }
          printResult = await this.print_it(client, interaction, [ props.mod ])
          embeds.mod = this.pages[0]
          this.pages = []
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

        /**
         * Region that this is being sent to
         *  Development
         *  Production; also sends to Discord Audit Log
         */
        let region = ((!this.DEV) ? "Production" : "Development")

        const logsChannel = await this.getChannel(client, interaction, log_type)
        if (logsChannel) {
          if(this.DEV) {
            emoji = "[DEV]" + emoji
          }


          let logFields = []
          let now = new Date()
          logFields.push(
            [
              // Logged DateTime
              {
                name: 'Time',
                value: timeFormat(now.getTime(), { with: "relative" })
              }
            ],
            [
              // Who'd what happen to?
              {
                name: 'User ' + tenses.past.ucfirst(),
                value: [
                  targetUser,
                  `[${inlineCode(targetUserId)}]`
                ]
              },
              // Whodunnit?
              {
                name: tenses.past.ucfirst() + ' By',
                value: [
                  interaction.user,
                  `[${inlineCode(interaction.user.id)}]`
                ]
              }
            ],
            [
              // Guild Info
              {
                name: 'Guild',
                value: interaction.guild.name + "\n" +
                  `[${inlineCode(interaction.guild.id)}]`
              }
            ]
          )

          // Timeout
          if (durationSeconds != 0) {
            let untilDateTime = new Date(now.getTime() + durationMilliseconds)
            logFields.push(
              [
                // Seconds
                {
                  name: 'Timeout Seconds',
                  value: `${durationSeconds} seconds`
                },
                // Duration
                {
                  name: 'Timeout Duration',
                  value: timeConversion(durationMilliseconds)
                }
              ],
              [
                // Until
                {
                  name: 'Timeout Until',
                  value: timeFormat(untilDateTime.getTime())
                }
              ]
            )
          }

          if (role != "") {
            logFields.push(
              [
                // Role
                {
                  name: 'Role',
                  value: role
                }
              ]
            )
          }

          logFields.push(
            [
              // Reason
              {
                name: 'Reason',
                value: reason
              }
            ]
          )

          logFields.push(
            [
              // Region
              {
                name: "Region",
                value: region
              }
            ]
          )

          props.log = {
            color: this.name == "unban" ? this.profile.colors.good : this.profile.colors.bad,
            title: {
              emoji: emoji,
              text: "[Log] User " + tenses.past.ucfirst()
            },
            playerTypes: {
              user: "caller",
              target: "target"
            },
            entities: {
              target: {
                name: targetUser.displayName,
                avatar: targetUser.displayAvatarURL({ size: Math.pow(2, 7) })
              }
            },
            fields: logFields
          }

          printResult = await this.print_it(client, interaction, [ props.log ])
          embeds.log = this.pages[0]
          this.pages = []
          logsChannel.send(
            {
              embeds: [ embeds.log ]
            }
          )
          console.log(`/${this.name}: LogPost`)
        } else {
          console.log(`${this.profile.emojis.fail} Logs channel not found.`)
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
          `Region:   ${region}`,
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
      let msg = `${this.profile.emojis.fail} There was an error when ${tenses.active}`
      if (lastingError) {
        msg += `: ${lastingError.stack}`
      }
      console.log(msg)
      props.mod.title = { text: "[YouPost]" }
      props.mod.error = true
      props.mod.ephemeral = true
      props.mod.description = `${this.profile.emojis.fail} I couldn't ${tenses.present} ${targetUser} [${inlineCode(targetUserId)}].`
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
      this.props.description = `${this.profile.emojis.fail} Failed to get Approved Roles.`
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

    // Process canned option values into sent option values
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

    // Run the action
    let actionResult = await this.action(client, interaction, coptions)

    return actionResult && !this.error
  }
}

exports.ModCommand = ModCommand
