// @ts-nocheck

const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class MemberCountCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "membercount",
      category: "meta",
      description: "Displays the total number of registered members on the server.",
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: {
        text: "Total Member Count"
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
    try {
      // Fetch all members in the server to ensure the data is up-to-date
      const members = await interaction.guild.members.fetch()

      // Filter out bot members
      const totalMembers = members.filter(member => !member.user.bot).size

      // Filter out bot members for bot count
      const totalBots = members.filter(member => member.user.bot).size

      // Create an embed to send the member count
      this.props.description = [
        `There are currently ${totalMembers} registered members in this server!`,
        `(Count includes staff and excludes our ${totalBots} bots.)`
      ]
    } catch (error) {
      this.error = true
      this.props.description = "There was an error fetching the member count."
      console.log(`Error fetching member count: ${error.stack}`)
    }

    return !this.error
  }
}
