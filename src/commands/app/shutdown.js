// @ts-nocheck

const { ChatInputCommandInteraction } = require('discord.js')
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const { RookClient } = require('../../classes/objects/rclient.class.js')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const UptimeCommand = require('../../commands/app/uptime.js')
const unready = require('../../events/unready/exit')
const colors = require('../../dbs/colors.json')

// Multiple messages

module.exports = class ShutdownCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "shutdown",
      category: "app",
      description: "Shutdown (and restart if pm2) rookbot",
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: { text: "Bot Shutdown", emoji: "⏹️" },
      color: colors["bad"]
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async execute(client, interaction, coptions={}, independent=false) {
    this.channel = await this.getChannel(client)

    if (interaction) {
      let isDeferred = interaction?.deferred && interaction.deferred
      let hasReply = interaction?.replied && interaction.replied
      if (
        !isDeferred &&
        !hasReply &&
        typeof interaction.deferReply === "function"
      ) {
        // await interaction.deferReply()
      }
    }

    let action = "Shutting Down"

    console.log(`!!! Bot Shutdown by: ${interaction?.member?.user?.username} !!!`)
    let processed_pm2 = false
    try {
      const pm2 = require('pm2')
      pm2.connect(function(err) {
        if (err) {
          console.log("🔴PM2: Error Connecting!")
          console.log(err)
          process.exit(2)
        }

        pm2.list(async (err, list) => {
          if (err) {
            console.log("🔴PM2: Error Listing Processes!")
          }

          for(let [, procItem] of Object.entries(list)) {
            if (procItem.name == "run") {
              action = "Restarting"
              console.log(`!!! RESTART`)
              pm2.restart(procItem.name, (err, proc) => {
                pm2.disconnect()
              })
            }
          }
        })
        processed_pm2 = true
      })
    } catch (err) {
      console.log("🟡PM2: No PM2!")
    }

    if (!processed_pm2) {
      console.log(`🟡/${this.name}: Skipping PM2!`)
      // Entities
      let entities = {
        bot: { name: client.user?.displayName, avatar: client.user?.avatarURL(), username: client.user?.username },
        user: { name: interaction?.user.displayName, avatar: interaction?.user.avatarURL(), username: interaction?.user.username }
      }
      // Players
      this.props.players = {
        user: entities.user,
        target: entities.bot
      }

      this.props.description = `${action} <@${client.user?.id}>`

      let this_embed = await new RookEmbed(client, this.props)
      await interaction?.reply({ embeds: [ this_embed ] })
      this.null = true
      // if (interaction) {
      //   interaction.deleteReply()
      // }

      let command = await new UptimeCommand(client)
      await command.execute(client, interaction)

      await unready(client, interaction)

      console.log(`!!! SHUTDOWN`)
      process.exit(1337)
    }

    return true
  }
}
