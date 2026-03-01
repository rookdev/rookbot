const getLocalCommands = require("../../utils/client/getLocalCommands")

module.exports = async (client, message) => {
  let result = false
  let messages = []

  if (message.content.charAt(0) == "/") {
    let coptions = {}
    let cmdString = message.content.substring(1)
    let cmdArgs = cmdString.split(" ")
    let cmdName = cmdArgs.shift()
    cmdArgs = cmdArgs.join(" ")
    let cmdOptions = cmdArgs.matchAll(/(\S+):((?:\S|[ ](?!\S+:))+)/g)
    if (cmdOptions) {
      cmdOptions = [...cmdOptions]
      for (let cmdOption of cmdOptions) {
        coptions[cmdOption[1]] = cmdOption[2]
      }
      console.log(cmdName,coptions)
    }

    const localCommands = await getLocalCommands(client)

    try {
      let commandObject = localCommands.find(
        cmd => cmd.name === cmdName
      )

      messages = messages.filter(item => item !== "")
      if (messages.length) {
        console.log(
          messages.map(m=>"   " + m).join("\n")
        )
        messages = []
      }

      if (commandObject) {
        result = await commandObject.execute(
          client,
          message,
          coptions
        ) 
      } else {
        message.reply(`[/]${cmdName}`)
      }
    } catch (error) {
      messages.push(`${client.profile.emojis.fail} There was an error running this command: ${error.stack}`)
      return [result, messages]
    }
  }

  return [result, messages]
}
