// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { ChannelType, codeBlock, inlineCode, bold, hyperlink, italic, ApplicationCommandOptionType } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

module.exports = class GuildInviteCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "guildinvite",
      category: "mod",
      description: "Guild Invite",
      options: [
        {
          name: "channel",
          description: "Channel (Channel)",
          type: ApplicationCommandOptionType.Channel
        },
        {
          name: "channel-id",
          description: "Channel ID",
          type: ApplicationCommandOptionType.String
        }
      ],
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: {
        text: "Guild Invite"
      }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    let interactionGuild = await this.getGuild(client, interaction)
    if (!interactionGuild) {
      this.error = true
      this.props.description = "Command must be run in guild."
      return false
    }

    // Set EmbedPlayerTypes to Bot|Guild
    this.props.playerTypes = {
      user: "bot",
      target: "guild"
    }

    let inviteCache = await interactionGuild.invites.fetch()

    let validInvites = 0

    this.props.description = []
    for (let [iID, invite] of inviteCache) {
      let expires = invite.expiresTimestamp !== null
      let limitedUse = invite.maxUses != 0
      if (!expires && !limitedUse) {
        let everyonePrivs = []
        let everyonPrivsStr = ""
        let channelRoles = await invite.channel.permissionOverwrites.cache
        for (let [chanRoleId, chanRolePerms] of channelRoles) {
          if (chanRoleId == await interactionGuild.roles.everyone.id) {
            if (chanRolePerms.deny) {
              everyonPrivsStr = "@everyone: " + client.profile.emojis.no + inlineCode(chanRolePerms.deny.toArray().join(","))
            }
          }
        }
        if (!everyonPrivsStr.includes("ViewChannel")) {
          validInvites++
          this.props.description.push(
            hyperlink(
              inlineCode(invite.code),
              invite.url
            ) + " " +
            mentionFuncs.channelMention(invite.channelId) + " " +
            mentionFuncs.userMention(invite.inviterId)
          )
        }
      }
    }

    if (validInvites == 0) {
      let targetInput = coptions["channel"] ?? coptions["channel-id"] ?? null
      if (targetInput) {
        // Get Target ID
        let targetId = targetInput.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >
        let channel = await this.getCache(client, interactionGuild, "channels", targetId)
        if (channel) {
          let everyonDenyStr = ""
          let channelRoles = await channel.permissionOverwrites.cache
          for (let [chanRoleId, chanRolePerms] of channelRoles) {
            if (chanRoleId == await interactionGuild.roles.everyone.id) {
              if (chanRolePerms.deny) {
                everyonDenyStr = "@everyone: " + client.profile.emojis.no + inlineCode(chanRolePerms.deny.toArray().join(","))
              }
            }
          }
          if (!everyonDenyStr.includes("ViewChannel")) {
            let newInvite = await interactionGuild.invites.create(
              targetId,
              { maxAge: 0 }
            )
            if (newInvite) {
              this.props.description.push(
                "Created " +
                hyperlink(
                  inlineCode(newInvite.code),
                  newInvite.url
                ) + " " +
                mentionFuncs.channelMention(newInvite.channelId) + " " +
                mentionFuncs.userMention(newInvite.inviterId)
              )
            }
          } else {
            this.props.description.push(
              client.profile.emojis.no + " " +
              mentionFuncs.channelMention(targetId) + " " +
              "doesn't have `ViewChannel` for `@everyone`!"
            )
          }
        }
      }
    }

    let dbRes = await dbFuncs.getDB(
      interactionGuild.id,
      "channels"
    )
    let guildChannels = dbRes[0]
    this.messages.push(...dbRes[1])

    if (guildChannels) {
      let verifyID = guildChannels?.verify
      if (verifyID) {
        this.props.description.push("")
        this.props.description.push(bold("Verify Channel"))
        this.props.description.push(mentionFuncs.channelMention(verifyID))
      }
      let resourcesID = guildChannels?.resources
      if (resourcesID) {
        this.props.description.push("")
        this.props.description.push(bold("Resources Channel"))
        this.props.description.push(mentionFuncs.channelMention(resourcesID))
      }
    }

    let onboarding = await interactionGuild.fetchOnboarding()
    // onboarding.prompts{}.options{}
    // options{}.channels{}
    // options{}.roles{}
    if (onboarding) {
      this.props.description.push("")
      let showOnboarding = true
      let showDefaultChannels = true
      if (onboarding?.defaultChannels?.size) {
        let defaultChannels = onboarding.defaultChannels
          .valueOf()
          .sort()
          .filter(c=>c)
        if (defaultChannels) {
          for (let [cID, cData] of defaultChannels) {
            let everyonDenyStr = ""
            let channelRoles = await cData.permissionOverwrites.cache
            for (let [chanRoleId, chanRolePerms] of channelRoles) {
              if (chanRoleId == await interactionGuild.roles.everyone.id) {
                if (chanRolePerms.deny) {
                  everyonDenyStr = "@everyone: " + client.profile.emojis.no + inlineCode(chanRolePerms.deny.toArray().join(","))
                }
              }
            }
            if (!everyonDenyStr.includes("ViewChannel")) {
              if (showOnboarding) {
                this.props.description.push(bold("Onboarding"))
                showOnboarding = false
              }
              if (showDefaultChannels) {
                this.props.description.push(italic("Default Channels"))
                showDefaultChannels = false
              }
              this.props.description.push(
                mentionFuncs.channelMention(cID)
              )
            }
          }
        }
      }
      if (onboarding?.prompts?.size) {
        if (showOnboarding) {
          this.props.description.push(bold("Onboarding"))
          showOnboarding = false
        }
        this.props.description.push("")
        this.props.description.push(bold("Prompts"))
        for (let [promptID, prompt] of onboarding?.prompts) {
          this.props.description.push(italic(prompt.title))
          if (prompt?.options?.size) {
            for (let [optID, option] of prompt?.options) {
              let optLine = italic(option.title)
              if (option?.emoji) {
                optLine = `${option.emoji} ${optLine}`
              }
              if (option?.description) {
                optLine += ": " + option.description
              }
              this.props.description.push(`> ${optLine}`)
              let optChannels = option?.channels
              let optRoles = option?.roles
              if (optChannels) {
                optChannels = optChannels
                  .valueOf()
                  .sort()
                  .filter(c=>c)
                  .map(c=>c.id)
                if (optChannels) {
                  for (let cID of optChannels) {
                    this.props.description.push(
                      "> " + 
                      mentionFuncs.channelMention(cID)
                    )
                  }
                }
              }
              if (optRoles) {
                optRoles = optRoles
                  .valueOf()
                  .sort()
                  .filter(r=>r.name != "@everyone")
                  .map(r=>r.id)
                if (optRoles) {
                  for (let rID of optRoles) {
                    this.props.description.push(
                      "> " +
                      mentionFuncs.roleMention(rID)
                    )
                  }
                }
              }
            }
          }
          this.props.description.push("")
        }
      }
    }

    return !this.error
  }
}
