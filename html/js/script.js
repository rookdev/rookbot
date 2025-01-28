// Read a text file
function readTextFile(file) {
  // Create a request
  let rawFile = new XMLHttpRequest()
  let allText = ""
  rawFile.onreadystatechange = function () {
    // If we're ready to read
    if (rawFile.readyState === 4) {
      // If it's OK
      if (rawFile.status === 200 || rawFile.status == 0) {
        // Return the thing
        allText = rawFile.responseText
        // If it's not OK
      } else if (rawFile.status === 404) {
        // Return null
        return null
      }
    }
  }

  // Get the thing
  rawFile.open("GET", file, false)
  rawFile.send(null)

  return allText
}

function init(mode = "index") {
  // Index
  if (mode == "index") {
    // Version
    let PACKAGE = readTextFile(".\\resources\\app\\meta\\manifests\\package.json")
    let PACKAGE_JSON = JSON.parse(PACKAGE)
    let VERSION = PACKAGE_JSON["version"]
    document.title += " v" + VERSION

    // rookbot
    let title = $("<h1></h1>")
      .attr({
        id: "title",
      })
      .text("rookbot")
    $("body").append(title)

    // Version hyperlink
    let subtitle = $("<h2><a>")
    let version_a = $("<a>")
      .attr({
        id: "version",
        href: "https://github.com/mysterypaintwo/rookbot/releases/tag/v" + VERSION
      })
      .text("Current Version: v" + VERSION)
    subtitle.append(version_a)
    $("body").append(subtitle)

    let list = $("<ul>")
    let help_li = $("<li>")
    let help_a = $("<a>")
      .attr({
        id: "help",
        href: "./help/"
      })
      .text("Help")
    help_li.append(help_a)
    list.append(help_li)
    $("body").append(list)

    let manifest = readTextFile(
      ".\\resources\\app\\meta\\manifests\\badges.json"
    )
    let badges = JSON.parse(manifest)
    for (let badge in badges) {
      badge = badges[badge]
      if(
        (!(badge?.disabled)) ||
        (badge?.disabled && !badge.disabled)
      ) {
        let label = badge["title"]
        let query = badge["query"]
        let left = badge["left"]
        let logo = badge.hasOwnProperty("logo") ? badge["logo"] : ""
        let logo_color = badge.hasOwnProperty("logo-color") ? badge["logo-color"] : ""
        let repo = "mysterypaintwo/rookbot/"
        let url = "https://img.shields.io/"
        url += badge["keyword"]
        url += "/"
        url += repo
        url += query.indexOf("?") == -1 ? "/" : ""
        url += query
        url += query.indexOf("?") == -1 ? "?" : "&"
        url += "style=flat-square"
        if (left != "") {
          url += "&" + "label=" + left.replace(/ /g, "%20")
        }
        if (logo != "") {
          url += "&" + "logo=" + logo
        }
        if (logo_color != "") {
          url += "&" + "logoColor=" + logo_color
        }
        url = url.replace(/<LATEST_TAG>/g, "v" + VERSION)
        let shield = $("<div>")
        let img = $("<img>").attr({
          src: url,
          title: label,
        })
        if (badge["url"] != "") {
          let a = $("<a>").attr({
            href: badge["url"].replace(/<LATEST_TAG>/g, "v" + VERSION)
          })
          a.append(img)
          shield.append(a)
        } else {
          shield.append(img)
        }
        $("body").append(shield)
      }
    }
  }
}
