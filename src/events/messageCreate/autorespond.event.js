// @ts-nocheck

const { ChannelType } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookMessage } = require('../../classes/objects/rmessage.class')
const SeedMetaCommand = require('../../commands/rando/seedmeta')
const autodetectRando = require('../../utils/rando/autodetectRando')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment-timezone')

module.exports = class AutoRespondEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "autorespond",
      event: "messageCreate",
      label: "AutoRespond",
      description: "Listen for messages for bot to respond to"
    }
    super(
      client,
      {...evtprops}
    )
  }

  async getURLs(content, pattern) {
    let urlMask = /[\(]?https?:\/\/[^\s]+[\)]?/g
    let urls = content.matchAll(urlMask)
    let collectedURLs = []
    
    if (urls) {
      urls = [...urls]
      for (let url of urls) {
        if (url) {
          url = url[0]
          if (pattern) {
            // this.messages.push(` URL Test: ${url}`)
            let matches = url.match(pattern)
            if (matches) {
              url = matches[0]
            }
          }
          if (url.startsWith("(") && url.endsWith(")")) {
            url = url.slicechop(1, 1)
            // FIXME: Hack to just not worry about masked URLs
            url = ""
          }
          if (url != "") {
            collectedURLs.push(url)
          }
        }
        // this.messages.push(` Matched URLs: ${JSON.stringify(matchedURLs)}`)
      }
    }

    if (!globalFuncs.empty(collectedURLs)) {
      // this.messages.push(` Returning Collected URLs`)
      return collectedURLs
    } else {
      // this.messages.push(` Returning No URLs`)
      return []
    }
  }

  // Minnie's Holy Images
  async respondHolyimages(client, message) {
    let content = await message.content
    let pattern = /https?:\/\/alttp\.mymm1\.com\/holyimage\/([^\-]+)-([^\.]+)\.html/
    let holyimages = await this.getURLs(content, pattern)
    if (holyimages) {
      for (let holyimage of holyimages) {
        let matches = holyimage.match(pattern)
        if (matches) {
          let gameID = matches[1]
          let slugID = matches[2]
          // if it does, respond with `/holyimages game-id:$gameID slug-id:$slugID`
          let props = {
            description: [
              "This looks like a Holy Image URL. Try the following next time:",
              `\`/holyimage game-id:${gameID} slug-id:${slugID}\``
            ]
          }
          let responseMessage = await new RookMessage(
            client,
            null,
            {
              channelName: message.channel.id,
              pages: props
            }
          )
          await responseMessage.execute()
          return true
        }
      }
    }
    return false
  }

  // No VC Text Channel usage
  async respondNoVCText(client, message) {
    if (message.author.id === client.user.id) { return }
    if (message.channel.type == ChannelType.GuildVoice) {
      await message.delete()
    }
  }

  // Seed Permalinks
  async respondPermalinks(client, message) {
    let content = await message.content
    let urls = await this.getURLs(content)
    let guild = await this.getGuild(client, message)

    if (urls && guild) {
      let gameID = ""
      let hashID = urls[0]

      let permalinkURL = ""
      let autodetect = false
      let autodetected = false

      if (!hashID) { return false } 
      [gameID, hashID, permalinkURL] = await autodetectRando(hashID)
      if (!gameID) { return false } 

      let props = {
        description: [
          `This looks like a Permalink URL.`,
          `GameID: ${gameID}`,
          `HashID: ${hashID}`,
          `URL: ${permalinkURL}`
        ]
      }
      // let responseMessage = await new RookMessage(
      //   client,
      //   null,
      //   {
      //     channelName: message.channel.id,
      //     pages: props
      //   }
      // )
      // await responseMessage.execute()

      let seedMetaCommand = new SeedMetaCommand(client)
      let seedMetaResult = await seedMetaCommand.execute(
        client,
        message,
        {
          'game-id': gameID,
          'hash-id': hashID
        },
        true
      )
      return true
    }
    return false
  }

  async respondScrubber(client, message) {
    if (message.author.id === client.user.id) { return }
    let guild = await this.getGuild(client, message)
    if (
      [
        "1450159772622913628" // ZDoI Rando Community
      ].includes(guild.id)
    ) {
      if (
        [
          "1450373860460462161", // vc-text
          "1450163849394258013" // multiplayer-vc-text
        ].includes(message.channel.id)
      ) {
        await message.delete()
      }
    }
  }

  // Wikis
  async respondWikis(client, message) {
    let content = await message.content
    let urls = await this.getURLs(content)
    let guild = await this.getGuild(client, message)
    let wikiFound = false

    let dbRes = await dbFuncs.getDB(guild.id, "interwiki")
    let interwikis = dbRes[0]
    // this.messages.push(...dbRes[1])

    if (urls && guild && interwikis) {
      let props = {
        description: []
      }
      // this.messages.push(` Got URLs: ${JSON.stringify(urls)}`)
      for (let [interwikiID, interwikiPattern] of Object.entries(interwikis)) {
        if (interwikiID.startsWith("#")) { continue }
        let filterPattern = interwikiPattern.replace("%s", "(.+)")
        let filterRegexp = new RegExp(filterPattern)
        let filteredURLs = urls.filter(url => filterRegexp.test(url))
        if (!globalFuncs.empty(filteredURLs)) {
          // this.messages.push(` Pattern: ${filterPattern}`)
          // this.messages.push(` Filtered URLs: ${JSON.stringify(filteredURLs)}`)
          for (let url of filteredURLs) {
            let matches = url.match(filterRegexp)
            if (matches) {
              let pagename = matches[1]
              let props = {
                description: [
                  "This looks like a Wiki URL. Try the following next time:",
                  `\`/wiki pagename:${pagename} wikikey:${interwikiID}\``
                ]
              }
              let responseMessage = await new RookMessage(
                client,
                null,
                {
                  channelName: message.channel.id,
                  pages: props
                }
              )
              await responseMessage.execute()
              return true
            }
          }
        }
      }
    }
    return false
  }

  // Trident Esports
  async respondTDNT(client, message) {
    let upcoming = message.channel.name.endsWith("-upcoming-events")
    let testing = message.channel.name.endsWith("-testing")
    let guild = await this.getGuild(client, message.channel)
    if (upcoming || testing) {
      let doTheThing = false
      let destForumNames = [""]
      let includeRoleNames = []
      if (testing) {
        for (let [emoji, repl] of Object.entries(
          {
            "📅": "schedule",
            "🏁": "results"
          }
        )) {
          destForumNames.push(
            message.channel.name.replace(
              "-testing",
              `-forum-${repl}`
            ).replace("🧪",emoji)
          )
        }
        includeRoleNames = [
          "537510776429084672",
          // "Bot"
        ]
      } else if (upcoming) {
        for (let [emoji, repl] of Object.entries(
          {
            "📅": "schedule",
            "🏁": "results"
          }
        )) {
          destForumNames.push(
            message.channel.name.replace(
              "-upcoming-events",
              `-${repl}`
            ).replace("📥",emoji)
          )
        }
        includeRoleNames = [
          "Team Operations Lead",
          "Social Lead",
          // "Bot"
        ]
        if (channel.parent) {
          let pattern = /([\w\s\|]+)/
          let matches = channel.parent.name.match(pattern)
          if (matches[1]) {
            includeRoleNames.push(matches[1])
          }
        }
      }

      if (message.content.contains("Create Test Event Channels")) {
        doTheThing = true
      }

      if (doTheThing) {
        this.messages.push(`Channel: ${message.channel.name}`)
        let eventDateTime = moment.now()
        let eventThreadName = eventDateTime
        for (let forumName of destForumNames) {
          if (forumName == "") { continue }
          this.messages.push(` Loading: ##${forumName}`)
          let forum = await this.getChannel(client, guild, forumName)
          if (!forum) {
            this.messages.push(`  Couldn't Load: ##${eventThreadName}`)
            return
          }
          let eventThread = await forum.threads.create(
            {
              name: eventThreadName,
              message: "Event Test"
            }
          )
          if (!eventThread) {
            this.messages.push(`  Couldn't Create: #${eventThreadName}`)
            return
          }
          this.messages.push(`  Created: #${eventThread.name}`)
          for (let roleName of includeRoleNames) {
            this.messages.push(`   Adding Role: @@${roleName}`)
            let threadRole = await this.getCache(client, guild, "roles", roleName)
            if (!threadRole) {
              return
            }
            let threadMembers = await threadRole.members
            for (let [roleMemberID, roleMember] of threadMembers) {
              this.messages.push(`    Adding Member: @${roleMember.nickname ?? roleMember.user.displayName}`)
              await eventThread.members.add(roleMember)
            }
          }
        }
        return true
      }
    }
  }

  async action(client, message) {
    // this.messages.push(`/${this.name}: Event Action`)
    // Reasons to bail
    // If no message
    if (! message) {
      // this.messages.push("No Message")
      return false
    }
    // If no guild
    if (! message.guild) {
      // this.messages.push("No Guild")
      return false
    }
    // If no channel
    if (! message.channel) {
      // this.messages.push("No Channel")
      return false
    }

    let guild = await this.getGuild(client, message)

    let dbRes = await dbFuncs.getDB(guild.id, "autoresponders", "", "fs", true)
    let responses = dbRes[0]
    this.messages.push(...dbRes[1])

    let responded = {}
    if (responses["keys"]) {
      for (let responseID of responses["keys"]) {
        let response = false
        switch(responseID) {
          case "holyimages":
            response = await this.respondHolyimages(client, message)
            break
          case "novctext":
            response = await this.respondNoVCText(client, message)
            break
          case "scrubber":
            response = await this.respondScrubber(client, message)
            break
          case "seedpermalinks":
            response = await this.respondPermalinks(client, message)
            break
          case "wiki":
            response = await this.respondWikis(client, message)
            break
          case "tdnt":
            response = await this.respondTDNT(client, message)
            break
        }
        if (response) {
          // this.messages.push(`Checked: ${responseID}:${response}`)
          responded[responseID] = response
        }
      }
    }

    if (!globalFuncs.empty(responded)) {
      this.messages.push(
        "🤖💬" +
        JSON.stringify(
          {
            guild: guild.name,
            member: message.author.tag,
            channel: message.channel.name,
            responded: responded
          }
        )
      )
    }

    return true
  }
}
