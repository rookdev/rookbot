// @ts-nocheck

// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
// UptimeCommand
const UptimeCommand = require('../../commands/app/uptime')
const unready = require('../../events/unready/exit')  // unreadyEvent

// Multiple messages

/**
 * @class
 * @classdesc App Exit
 * @this {ExitCommand}
 * @extends {BotDevCommand}
 * @public
 */
module.exports = class ExitCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "exit",
      category: "app",
      description: "Exit rookbot",
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: {
        emoji:  client.profile.emojis.stop,
        text:   "Exit"
      },
      color: client.profile.colors.bad
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async execute(client, interaction, coptions={}, independent=false) {
    // If we can defer, do it
    if (
      interaction &&
      typeof interaction.deferReply === "function"
    ) {
      await interaction.deferReply()
    }

    // Log who called Exit
    console.log(`!!! Bot Exit by: ${interaction.member.user.tag} !!!`)
    this.props.description = `Exiting <@${client.user.id}>`

    // Call UptimeCommand
    let uptime = await new UptimeCommand(client)
    await uptime.execute(client, interaction)

    // Run unreadyEvent
    await unready(client, interaction)

    // Alert with EXIT action
    console.log(`!!! EXIT`)
    // Exit with exit code 1337
    process.exit(1337)
    return true
  }
}
