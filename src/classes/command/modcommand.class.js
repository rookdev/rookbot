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
  italic
} = require('discord.js')
// Admin Command
const { AdminCommand } = require('./admincommand.class')
const { RookMessage } = require('../objects/rmessage.class')
// Base Rook Embed
const { RookEmbed } = require('../embed/rembed.class')
// Convert milliseconds to d/h/m/s
const timeConversion = require('../../utils/formatters/timeConversion')
const mentionFuncs = require('../../utils/formatters/mentions')
const AsciiTable = require('ascii-table')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')
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
    let guild = await this.getGuild(interaction.client, interaction)

    this.messages.push("Adjust Roles:",user.displayName,roles)

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
        addRole = await this.getCache(interaction.client, guild, "roles", addRole)
      } else {
        // Search for the Role object by Role Name
        addRole = await this.getCache(interaction.client, guild, "roles", addRole)
      }
      // Add the Role
      // @ts-ignore
      if (
        addRole &&
        (addRole != 0)
      ) {
        try {
          let hasRole = await this.getCache(interaction.client, user, "roles", addRole.id)
          if (!hasRole) {
            // this.messages.push(`Adding Role: ${user.displayName} [${addRole.id}]`)
            await user.roles.add(addRole.id)
          }
          success = true
        } catch(e) {
          this.messages.push(e)
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
        remRole = await this.getCache(interaction.client, guild, "roles", remRole)
      } else {
        // Search for the Role object by Role Name
        remRole = await this.getCache(interaction.client, guild, "roles", remRole)
      }
      // Remove the Role
      // @ts-ignore
      if (
        remRole &&
        (remRole != 0)
      ) {
        try {
          let hasRole = await this.getCache(interaction.client, user, "roles", remRole.id)
          if (hasRole) {
            // this.messages.push(`Removing Role: ${user.displayName} [${remRole.id}]`)
            await user.roles.remove(remRole.id)
          }
          success = true
        } catch(e) {
          this.messages.push(e)
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
      this.props.description = `${this.profile.emojis.prod} ${mentionFuncs.userMention(user.id)} has been ${voice}d`
    } else {
      this.props.description = `${this.profile.emojis.dev} ${mentionFuncs.userMention(user.id)} ${italic('would be')} ${bold(voice + 'd')} if this wasn't in DEV Mode`
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
    let lastingError

    // Get Guild ID
    let guild = await this.getGuild(client, interaction)
    const guildID = coptions["guild-id"] ?? guild?.id
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
    let durationStr = ""
    if (duration) {
      durationSeconds = Math.abs(duration)
      durationMilliseconds = durationSeconds * 1000
      durationStr = timeConversion(durationMilliseconds)
    }
    let now = moment.utc()
    let timeoutUntil = moment.utc(
      parseInt(now.format("x")) +
      parseInt(durationMilliseconds)
    )

    let props = {
      public: { null: true },
      dm:     { null: true },
      mod:    { null: true },
      log:    { null: true }
    }
    let embeds = {}

    let pretty_name = this.name.split("_").map(x=>x.ucfirst()).join(" ")

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
        tenses.past = "Unbanned"
        tenses.active = tenses.past.replace("ed","ing")
        emoji = "🪃"
        break
      case "Ban":
        tenses.past = "Banned"
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
        tenses.past = "Timed Out"
        tenses.active = "Timing Out"
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
          inlineCode(`ID: ${targetUserId}`)
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
    const guildMember = await this.getCache(client, guild, "members", targetUserId)
    const user = guildMember?.user ?? targetUser

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
            success = await guild.members.ban(
              targetUserId,
              banOptions
            )
            break

          // Kick
          case "kick":
            success = await guild.members.kick(
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
            success = await guild.members.unban(
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
            // success = await guild.members.warn(
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
          (role != "" ? `Role: ${mentionFuncs.roleMention(role)}; Reason: ` : "") +
          // (durationStr != "" ? `Duration: ${durationStr}; Reason: ` : "") +
          reason +
          ")"
        ]
        if (!this.null) {
          let modPost = await new RookMessage(
            client,
            interaction,
            {
              channelName: interaction.channel.id,
              pages: [ props.public ]
            }
          )
          await modPost.execute()
        }
        this.messages.push(`/${this.name}: ModPost`)
      }

      if (success && (!this.DEV || true)) {
        // DM post for ACTION
        try {
          let dm_desc = `You have been ${tenses.past} from the ${guild.name} server. ` +
          `(` +
          (role != "" ? `Role: ${role}; Reason: ` : "") +
          (durationSeconds != 0 ? `Duration: ${timeConversion(durationMilliseconds)}; Until: ${timeFormat(timeoutUntil.format("x"))}; Reason: ` : "") +
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
          props.dm.color = this.profile.colors.warning
          props.dm.title = {
              emoji: this.profile.emojis.warn,
              text: (this.DEV ? "[DM] " : "") + pretty_name
          }
          props.dm.playerTypes = {
              user: "bot",
              target: "guild"
          }
          props.dm.desc = dm_desc
          if (!this.DEV) {
            let dmPost = await new RookMessage(
              client,
              interaction,
              {
                channelName: targetUser,
                pages: [ props.dm ]
              }
            )
            await dmPost.execute()
            // await targetUser.send(
            //   {
            //     embeds: [ embeds.dm ]
            //   }
            // )
          }
          // this.messages.push(`/${this.name}: DM Post`)

          // Reply to Mod for DM about ACTION
          this.ephemeral = true
          props.mod.color = this.profile.colors.success
          props.mod.title = {
            emoji: this.profile.emojis.good,
            text: "[YouPost] Success!"
          }
          props.mod.playerTypes = {
            user: "bot",
            target: "target"
          }
          props.mod.entities = {
            target: {
              name: targetUser.displayName,
              avatar: await targetUser.displayAvatarURL({ size: 128 })
            }
          }
          props.mod.ephemeral = true
          // Do link user
          props.mod.description = [
            `${this.profile.emojis.check} User ${mentionFuncs.userMention(targetUserId)} successfully ${bold(tenses.past)} via DMs!`,
          ]
          props.mod.description.push(
            "",
            `Message: ${props.dm.description}`
          )
          printResult = await this.print_it(client, interaction, [ props.mod ])
          embeds.mod = this.pages[0]
          this.pages = []
          if (interaction.hasOwnProperty("followUp")) {
            interaction.followUp(
              {
                embeds: [ embeds.mod ],
                flags: MessageFlags.Ephemeral
              }
            )
            this.messages.push(`/${this.name}: YouPost`)
          }
        } catch (dmError) {
          // Reply to Mod about failed DM for ACTION
          this.ephemeral = true
          this.messages.push(`${this.profile.emojis.fail} Failed to DM user: ${dmError.message}`)
          props.mod.color = this.profile.colors.error
          props.mod.title = { text: "[YouPost] Error" }
          props.mod.description = [
            `${this.profile.emojis.fail} I couldn't send the DM to the user [${targetUserId}].`,
            `They might have DMs disabled.`
          ]
          props.mod.ephemeral = true
          printResult = await this.print_it(client, interaction, [ props.mod ])
          embeds.mod = this.pages[0]
          this.pages = []
          if (interaction.hasOwnProperty("followUp")) {
            interaction.followUp(
              {
                embeds: [ embeds.mod ],
                flags: MessageFlags.Ephemeral
              }
            )
          }
        }
      }

      if (success && (!this.DEV || true)) {
        // LogPost for ACTION

        /**
         * Region that this is being sent to
         *  Development
         *  Production; also sends to Discord Audit Log
         */
        let region = ((!this.DEV) ? "Production" : "Development")

        const logsChannel = await this.getChannel(client, interaction, [ `logging-${this.name}`, "logging" ])
        if (logsChannel) {
          if(this.DEV) {
            emoji = "[DEV]" + emoji
          }


          let logFields = []
          let now = moment.utc()
          logFields.push(
            [
              // Logged DateTime
              {
                name: 'Time',
                value: timeFormat(now.format("x"), { with: "relative" })
              }
            ],
            [
              // Who'd what happen to?
              {
                name: 'User ' + tenses.past.ucfirst(),
                value: mentionFuncs.userMention(
                  targetUserId,
                  { showID: true }
                )
              },
              // Whodunnit?
              {
                name: tenses.past.ucfirst() + ' By',
                value: mentionFuncs.userMention(
                  interaction?.user?.id,
                  { showID: true }
                )
              }
            ],
            [
              // Guild Info
              {
                name: 'Guild',
                value: mentionFuncs.guildMention(
                  guild.name,
                  guild.id,
                  { showID: true }
                )
              }
            ]
          )

          // Timeout
          if (durationSeconds != 0) {
            let untilDateTime = moment.utc(
              parseInt(now.format("x")) +
              parseInt(durationMilliseconds)
            )
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
                  value: timeFormat(untilDateTime.format("x"), { with: "relative" })
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
                  value: mentionFuncs.roleMention(role, { showID: true })
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

          props.log.color = this.name == "unban" ? this.profile.colors.good : this.profile.colors.bad
          props.log.title = {
            emoji: emoji,
            text: "[Log] User " + tenses.past.ucfirst()
          }
          props.log.playerTypes = {
            user: "caller",
            target: "target"
          }
          props.log.entities = {
            target: {
              name: targetUser.displayName,
              avatar: await targetUser.displayAvatarURL({ size: 128 })
            }
          }
          props.log.fields = logFields

          let logPost = await new RookMessage(
            client,
            interaction,
            {
              channelName: logsChannel.id,
              pages: [ props.log ]
            }
          )
          await logPost.execute()
          this.messages.push(`/${this.name}: LogPost`)
        } else {
          this.messages.push(`${this.profile.emojis.fail} Logs channel not found.`)
        }

        // LogFile for ACTION
        let logFilePath = fileFuncs.getAPath(
          [
            "src",
            "botlogs"
          ],
          ((this.DEV ? "DEV" : "") + "member" + pretty_name.replace(" ", "") + "s.log")
        )
        let logEntry = [
          `[${now.toISOString()}]`,
          `User:     ${user.tag} (ID: ${user.id})`,
          `Actor:    ${interaction?.user?.tag} (ID: ${interaction?.user?.id})`,
          `Action:   ${tenses.past.ucfirst()}`,
          `Guild:    ${guild?.name} (ID: ${guild?.id})`,
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
        this.messages.push(`/${this.name}: LogFile`)
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
      this.messages.push(msg)
      props.mod.title = { text: "[YouPost]" }
      props.mod.error = true
      props.mod.ephemeral = true
      props.mod.description = `${this.profile.emojis.fail} I couldn't ${tenses.present} ${mentionFuncs.userMention(targetUser.id, { showID: true })}.`

      let modPost = await new RookMessage(
        client,
        interaction,
        {
          channelName: interaction.channel.id,
          pages: [ props.mod ]
        }
      )
      await modPost.execute()
      this.null = true
    }

    return success && !lastingError
  }

  async build(client, interaction, coptions={}) {
    this.messages.push(`/${this.name}: Mod Build`)

    // Get list of roles
    // DB
    let guild = await this.getGuild(client, interaction)
    let dbRes = await dbFuncs.getDB(
      guild.id,
      "roles"
    )
    this.ROLES = dbRes[0]
    this.messages.push(...dbRes[1])
    // /DB

    if (
      (
        !(coptions.hasOwnProperty("bypass"))
      ) &&
      this.ROLES &&
      (
        (this.ROLES.length > 0) ||
        (Object.keys(this.ROLES).length > 0)
      )
    ) {
      // Get Mod roles
      let APPROVED_ROLES = this.ROLES["admin"].concat(this.ROLES["mod"])
      // Bail if we don't have intended Approved Roles data
      if (!APPROVED_ROLES) {
        this.error = true
        this.props.description = `${this.profile.emojis.fail} Failed to get Approved Roles for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })}`
        return false
      }

      // Bail if member doesn't have Approved Roles
      if(!(await interaction.member.roles.cache.some(r=>APPROVED_ROLES.includes(r.name))) ) {
        this.error = true
        this.props.description = this.errors.adminOnly
        this.props.fields = []
        this.props.footer = { text: "" }
        this.props.image = { image: "" }
        return false
      }
    }

    // If we don't have an error yet,
    //  Process canned option values into sent option values
    if (!(this.error)) {
      for (let option of this.options) {
        if ((!(coptions.hasOwnProperty(option.name)))) {
          let thisOption = interaction?.options?.get(option.name)
          if (thisOption) {
            coptions[option.name] = thisOption.value
          }
        }
      }
    }

    if (this.defaultOptions) {
      for (let [optName, optVal] of Object.entries(this.defaultOptions)) {
        if ((!(coptions.hasOwnProperty(optName)))) {
          coptions[optName] = optVal
        }
      }
    }

    // If we've got options sent, print them
    if (coptions && Object.keys(coptions).length > 0) {
      let Table = new AsciiTable(
        `/${this.name}: Mod Build Options`,
        {}
      )
        .setBorder('|','-','•','•')
        .setHeading(
          "Option",
          "Value"
        )
      for (let [oName, oVal] of Object.entries(coptions)) {
        if (oVal) {
          Table.addRow(oName, oVal)
        }
      }
      this.messages.push(Table.toString())
    }

    // Run the action
    let actionResult = await this.action(client, interaction, coptions)

    return actionResult && !this.error
  }
}

exports.ModCommand = ModCommand
