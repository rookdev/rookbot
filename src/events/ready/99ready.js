// @ts-nocheck
module.exports = async (client, interaction) => {
  let result = false
  let messages = []

  messages.push(`${client.profile.emojis[client.platform]} ${client.platform.ucfirst()} as '${client.user?.tag || client.user.username}' is ready!`)
  messages.push(client.eventNames)

  return [result, messages]
}
