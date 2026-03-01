// @ts-nocheck
module.exports = async (client, interaction) => {
  let result = false
  let messages = []

  messages.push(`${client.profile.emojis[client.platform]} ${client.platform.ucfirst()} as '${client.user.tag}' is ready!`)

  return [result, messages]
}
