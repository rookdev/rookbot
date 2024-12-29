// @ts-nocheck

// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
// UptimeCommand
const UptimeCommand = require('../../commands/app/uptime.js')
// Base Rook Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const unready = require('../../events/unready/exit')  // unreadyEvent
const colors = require('../../dbs/colors.json')       // Standardized colors

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
    this.props.playerTypes = {
      user: "caller",
      target: "bot"
    }

    // Get Channel
    this.channel = await this.getChannel(client)

    let action = "Shutting Down"

    // Log who called Shutdown
    console.log(`!!! Bot Shutdown by: ${interaction?.member?.user?.username} !!!`)

    // Try pm2
    let processed_pm2 = false
    try {
      const pm2 = require('pm2')

      // Connect to pm2
      pm2.connect(function(err) {
        if (err) {
          console.log("🔴PM2: Error Connecting!")
          console.log(err)
          process.exit(2)
        }

        // List pm2 daemons
        pm2.list(async (err, list) => {
          if (err) {
            console.log("🔴PM2: Error Listing Processes!")
          }

          // Cycle through daemons
          for(let [, procItem] of Object.entries(list)) {
            // If it's running
            if (procItem.name == "run") {
              // Log that we're restarting
              action = "Restarting"
              console.log(`!!! RESTART`)
              // Restart by disconnecting
              pm2.restart(procItem.name, (err, proc) => {
                pm2.disconnect()
              })
            }
          }
        })
        processed_pm2 = true
      })
    } catch (err) {
      // pm2 not found
      console.log("🟡PM2: No PM2!")
    }

    // pm2 didn't work
    if (!processed_pm2) {
      console.log(`🟡/${this.name}: Skipping PM2!`)
      this.props.playerTypes = {
        user: "bot",
        target: "guild"
      }

      this.props.description = `${action} <@${client.user?.id}>`

      // Post action taking place
      let this_embed = await new RookEmbed(client, this.props)
      await interaction?.reply({ embeds: [ this_embed ] })
      this.null = true

      // Call UptimeCommand
      let command = await new UptimeCommand(client)
      await command.execute(client, interaction)

      // Run unreadyEvent
      await unready(client, interaction)

      // Alert with SHUTDOWN action
      console.log(`!!! SHUTDOWN`)
      // Exit with exit code 1337
      process.exit(1337)
    }

    return true
  }
}
