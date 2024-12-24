// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
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
    let gameID = coptions['game-id'] ?? "z3r"
    let slugID = coptions['slug-id'] ?? "verify"
    // console.log(gameID,slugID)

    let gameNames = await get_url(`http://alttp.mymm1.com/holyimage/metadata.php?mode=gameIDs&expand=1`)
    let gameName = gameNames["games"][gameID]

    let holyimages  = await get_url(`http://alttp.mymm1.com/holyimage/holyimages-${gameID}.json`)

    let image = null

    for(let this_image of holyimages[gameID]) {
      if(
        (this_image.slug == slugID) ||
        (this_image?.aliases && (this_image.aliases.indexOf(slugID) > -1))
      ) {
        // console.log(
        //   this_image.title,
        //   this_image.slug,
        //   this_image?.aliases ? this_image.aliases : []
        // )
        image = this_image
      }
      if(image) {
        break
      }
    }

    if(image) {
      let page_url = `http://alttp.mymm1.com/holyimage/${gameID}-${slugID}.html`
      this.props.title = {
        text: image.title,
        url: page_url
      }

      let image_url = image.url
      if(image_url.indexOf("http://") < 0 && image_url.indexOf("https://") < 0) {
        image_url = `http://alttp.mymm1.com/holyimage/${image_url}`
      }
      this.props.players = {
        user: {
          name: "Minnie's Holy Images",
          url: "http://alttp.mymm1.com/holyimage/",
          avatar: "https://images-ext-1.discordapp.net/external/KJ12pcqE9iTvRJCKDFVbENEb9GsOoP62ZQlGRScJ4aw/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/263968998645956608/b4767c97e4643d5a2f98d7deca0c0d67.webp?format=webp&width=683&height=683"
        },
        target: {
          name: "Holy Image",
          avatar: image_url
        }
      }

      let desc = image.desc
        .replaceAll(/<a href="([^"]+)">([^<]+)<\/a>/igm, '[$2]($1)')
        .replaceAll(/<a href="([^"]+)" title="([^"]+)">([^<]+)<\/a>/igm, '[$3]($1 "$2")')

      let seeAlsoSearch = "<br /><br />See also:"
      if(desc.indexOf(seeAlsoSearch) > -1) {
        desc = desc.substring(0, desc.indexOf(seeAlsoSearch))
      }

      desc = desc.replaceAll("<br />", "\n")
      desc = desc.replaceAll("<br/>", "\n")
      desc = desc.replaceAll("<br>", "\n")

      this.props.description = desc

      this.props.fields = []
      this.props.fields.push(
        [
          {
            name: "Game",
            value: gameName
          }
        ]
      )

      if(image.credit) {
        this.props.fields.push(
          [
            {
              name: "Credit",
              value: `*${image.credit}*`
            }
          ]
        )
      }
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

      let source = image.mode == "redirect" ? "Redirect" : "Source"
      this.props.fields.push(
        [
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
