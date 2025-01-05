// @ts-nocheck

// Command Option Types, Formatters: italic
const { ApplicationCommandOptionType, italic } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

async function get_url(in_url) {
  try {
    let req = await fetch(in_url)
    let json = await req.json()
    return json
  } catch(e) {
    console.log(e.stack)
  }
}

module.exports = class HolyImageCommand extends RookCommand {
  constructor(client) {
    // let gameIDs     = await get_url(`http://alttp.mymm1.com/holyimage/games.json`)
    // let gameIDsPlus = await get_url(`http://alttp.mymm1.com/holyimage/metadata.php?mode=gameIDs&expand=1`)

    // let slugIDs     = await get_url(`http://alttp.mymm1.com/holyimage/slugs-${gameID}.json`)
    // let slugIDsPlus = await get_url(`http://alttp.mymm1.com/holyimage/metadata.php?game=${gameID}&expand=1`)
    let comprops = {
      name: "holyimage",
      category: "rando",
      description: "Calls a Holy Image",
      options: [
        {
          name: "game-id",
          description: "Game ID to call from",
          type: ApplicationCommandOptionType.String,
          autocomplete: false
        },
        {
          name: "slug-id",
          description: "Slug ID to call",
          type: ApplicationCommandOptionType.String,
          autocomplete: false
        }
      ],
      testOptions: [
        {},
        { "game-id": "smz3" },
        { "game-id": "smz3", "slug-id": "crc" }
      ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    let gameID = coptions['game-id'] ?? "z3r"     // Get Game ID
    let slugID = coptions['slug-id'] ?? "verify"  // Get Slug ID
    // console.log(gameID,slugID)

    // Get Game Names
    let gameNames = await get_url(`http://alttp.mymm1.com/holyimage/metadata.php?mode=gameIDs&expand=1`)
    // Get this Game Name
    let gameName = gameNames["games"][gameID]

    // Get this game's Holy Images
    let holyimages  = await get_url(`http://alttp.mymm1.com/holyimage/holyimages-${gameID}.json`)

    let image = null

    // Cycle through this game's Holy Images
    for(let this_image of holyimages[gameID]) {
      if(
        (this_image.slug == slugID) ||
        (this_image?.aliases && this_image.aliases.includes(slugID))
      ) {
        // If this Image matches the one we want...

        // console.log(
        //   this_image.title,
        //   this_image.slug,
        //   this_image?.aliases ? this_image.aliases : []
        // )
        image = this_image
      }
      if(image) {
        // We found the Image we want, bounce
        break
      }
    }

    // If we retrieved a Holy Image
    if(image) {
      // Page URL
      let page_url = `http://alttp.mymm1.com/holyimage/${gameID}-${slugID}.html`
      // Set Title
      this.props.title = {
        text: image.title,
        url: page_url
      }

      // Get Image URL
      let image_url = image.url
      if(image_url.indexOf("http://") < 0 && image_url.indexOf("https://") < 0) {
        image_url = `http://alttp.mymm1.com/holyimage/${image_url}`
      }
      // Set EmbedPlayerTypes to User|Target
      this.props.playerTypes = {
        user: "user",
        target: "target"
      }
      this.props.entities = {
        // Override User
        user: {
          name: "Minnie's Holy Images",
          url: "http://alttp.mymm1.com/holyimage/",
          avatar: "https://cdn.discordapp.com/avatars/263968998645956608/f3e20428f32ae6ebea3be438916027b8.webp?size=128"
        },
        // Override Target
        target: {
          name: "Holy Image",
          avatar: image_url
        }
      }

      // Get Image Description
      // Convert <a> tags to md
      let desc = image.desc
        .replaceAll(/<a href="([^"]+)">([^<]+)<\/a>/igm, '[$2]($1)')
        .replaceAll(/<a href="([^"]+)" title="([^"]+)">([^<]+)<\/a>/igm, '[$3]($1 "$2")')

      // Add See Also
      let seeAlsoSearch = "<br /><br />See also:"
      if(desc.includes(seeAlsoSearch)) {
        desc = desc.substring(0, desc.indexOf(seeAlsoSearch))
      }

      // Convert linebreaks
      desc = desc.replaceAll("<br />", "\n")
      desc = desc.replaceAll("<br/>", "\n")
      desc = desc.replaceAll("<br>", "\n")

      this.props.description = desc

      this.props.fields = []
      this.props.fields.push(
        [
          // Game
          {
            name: "Game",
            value: gameName
          }
        ]
      )

      if(image.credit) {
        this.props.fields.push(
          [
            // Credit
            {
              name: "Credit",
              value: italic(image.credit)
            }
          ]
        )
      }
      // See Alsos
      if(image["see-also"]) {
        let alsos = ""
        for(let also of image["see-also"]) {
          if(also?.name && also?.url) {
            alsos += `[${also.name}](${also.url}), `
          } else {
            alsos += `[\$${also}](http://alttp.mymm1.com/holyimage/${gameID}-${also}.html), `
          }
        }
        if(alsos != "") {
          alsos = alsos.substring(0,alsos.length - 2)
        }
        this.props.fields.push(
          [
            {
              name: "See Also",
              value: alsos
            }
          ]
        )
      }

      // Mode
      let source = image.mode == "redirect" ? "Redirect" : "Source"
      this.props.fields.push(
        [
          // Links
          //  Index Listing
          //  Source
          {
            name: "Links",
            value: `[Index Listing](http://alttp.mymm1.com/holyimage/debug.php?game=${gameID}), [${source}](${page_url})`
          }
        ]
      )
    } else {
      this.error = true
      this.props.description = "Holy Image not found!"
    }

    return !this.error
  }
}
