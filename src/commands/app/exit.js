// @ts-nocheck

const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const UptimeCommand = require('../../commands/app/uptime.js')
const unready = require('../../events/unready/exit')
const colors = require('../../dbs/colors.json')

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
        emoji:  "⏹️",
        text:   "Exit"
      },
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
    if (
      interaction &&
      typeof interaction.deferReply === "function"
    ) {
      await interaction.deferReply()
    }

    console.log(`!!! Bot Exit by: ${interaction.member.user.tag} !!!`)
    this.props.description = `Exiting <@${client.user.id}>`

    let uptime = await new UptimeCommand(client)
    await uptime.execute(client, interaction)

    await unready(client, interaction)

    console.log(`!!! EXIT`)
    process.exit(1337)
    return true
  }
}
