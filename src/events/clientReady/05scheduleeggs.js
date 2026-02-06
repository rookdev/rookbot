// @ts-nocheck
const { FakeInteraction } = require('../../classes/objects/finteraction.class')
const SayCommand = require('../../commands/botdo/say')
const schedule = require('node-schedule')


const TESTING = false

// Set it for midnight Pacific Time,
//  which is superior to Eastern Palace Time
const midnightPacific = {
  hour: 0,
  minute: 0,
  tz: "America/Los_Angeles"
}

async function scheduleFire(client) {
  let result = false
  let messages = []
  result = schedule.scheduleJob(midnightPacific, async () => { return await runFire(client) })

  messages.push(`❤️‍🔥Scheduled Fire for Mothula.`)
  return [result, messages]
}
async function runFire(client) {
  let result = false
  let messages = []

  try {
    // Get ZDoI Rando Community
    let guild = await client.guilds.fetch("1450159772622913628")
    if (guild) {
      // Get Say Command Object
      let sayCmd = new SayCommand(client)

      // Create Dummy Interaction object
      let channelId = ""
      if (TESTING) {
        channelId = "1461760186682310788" // bot-testing
      } else {
        channelId = "1450518001383243837" // multiworld-general
      }
      let fakeInteraction = new FakeInteraction(
        {
          client:     client,
          guild:      guild,
          channelId:  channelId,
          cmd:        sayCmd
        }
      )

      // Create Args
      let args = {
        message:        "Hello everyone, this is your daily dose of <:firerod:1450186094288175285>.",
        channel:        channelId,
        "visage-name":  "heat-miser"
      }

      // Execute Say Command Object
      result = await sayCmd.execute(
        client,
        fakeInteraction,
        args
      )
    }
  } catch(err) {
    messages.push(err.stack)
  }

  return [result, messages]
}

module.exports = async (client) => {
  let result = false
  let messages = []

  let results = await scheduleFire(client)
  result = results[0]
  messages.push(...results[1])

  if (TESTING) {
    results = await runFire(client)
    result = results[0]
    messages.push(...results[1])
  }

  return [result, messages]
}
