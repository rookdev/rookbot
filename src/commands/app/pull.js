// @ts-nocheck

// Command Option Types, Formatters: inlineCode, hyperlink
const { ApplicationCommandOptionType, inlineCode, hyperlink } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const shell = require('shelljs')  // Run shell commands
const path = require('path')      // Easier path management
const fs = require('fs')          // Filesystem manipulation

/**
 * @class
 * @classdesc Git Pull
 * @this {PullCommand}
 * @extends {BotDevCommand}
 * @public
 */
module.exports = class PullCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "pull",
      category: "app",
      description: "Pull from Main",
      options: [
        {
          name: "branch",
          description: "Override branch to pull from",
          type: ApplicationCommandOptionType.String
        }
      ],
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: { text: "Pull", emoji: "⏫" }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    let BRANCH = "" // Branch Name
    // Commit Data
    let COMMITS = {
      current: "",
      latest: "",
      new: ""
    }

    if (!this.DEV) {
      // Checkout
      try {
        let selectedBranch = coptions["branch"] ?? "main"
        shell.exec(`git checkout ${selectedBranch}`)
      } catch(err) {
        console.log(err.stack)
      }
    }

    // Get Branch
    try {
      if (fs.existsSync("./.git/HEAD")) {
        // @ts-ignore
        BRANCH = fs.readFileSync("./.git/HEAD","utf8").trim().match(/(?:\/)([^\/]*)$/)
        if (BRANCH && (BRANCH.length > 0)) {
          // @ts-ignore
          BRANCH = BRANCH[1]
        }
      } else if (process.env?.HOME == "/app") {
        BRANCH = "heroku"
      }
    } catch (err) {
      console.log(err)
    }

    // Get Current commit ID
    try {
      let git_log_exec = shell.exec(
        "git log -1",
        { silent: true }
      )
      let git_log = git_log_exec.stdout.trim()
      let commits = git_log.split("\n")
      let latest_commit = commits[0 * 6]
      let matches = latest_commit.match(/^(?:[^\s]+)(?:[\s])([^\s]{7})/)
      if (matches && (matches.length > 0)) {
        COMMITS.current = matches[1]
      }
    } catch (err) {
      console.log(err.stack)
    }

    if (!this.DEV) {
      // Pull
      try {
        shell.exec("git pull origin")
      } catch(err) {
        console.log(err.stack)
      }
    }

    // Get Fresh commit ID
    // Get previous commit ID
    try {
      let git_log_exec = shell.exec(
        "git log -2",
        { silent: true }
      )
      let git_log = git_log_exec.stdout.trim()
      let commits = git_log.split("\n")
      let latest_commit = commits[0 * 6]
      COMMITS.fresh = latest_commit.match(/^(?:[^\s]+)(?:[\s])([^\s]{7})/)
      if (COMMITS.fresh && (COMMITS.fresh.length > 0)) {
        COMMITS.fresh = COMMITS.fresh[1]
      }
      let second_commit = commits[1 * 6]
      COMMITS.prev = second_commit.match(/^(?:[^\s]+)(?:[\s])([^\s]{7})/)
      if (COMMITS.prev && (COMMITS.prev.length > 0)) {
        COMMITS.prev = COMMITS.prev[1]
      }
    } catch (err) {
      console.log(err.stack)
    }

    // Get Client User
    let user = client?.user

    // Bucket for console output
    let console_output = [
      "---"
    ]

    // Print Name & Version number
    console_output.push(
      "Updating " +
      (user ? user.username : "") +
      ` v${this.profile.PACKAGE.version}!`
    )
    let ci_data = require(
      path.join(
        __dirname,
        "..",
        "..",
        "..",
        "resources",
        "app",
        "meta",
        "manifests",
        "ci"
      )
    )
    let git_info = ci_data.common.common.repo
    git_info.root = `https://github.com/${git_info.username}/${git_info.repository}`

    this.props = {
      title: {
        text: console_output[1],
        emoji: "⏫",
        url: git_info.root
      }
    }

    console_output.push(
      `Branch Key:      <${BRANCH}>`,
      `Current Commit:  [${COMMITS.current}]`,
      `Fresh Commit:    [${COMMITS.fresh}]`,
      `Previous Commit: [${COMMITS.prev}]`,
      ""
    )

    // console.log(console_output)

    /*

    console_output[1] = ---
    console_output[2] = MODE
    console_output[3] = Footer  Tag
    console_outout[4] = Profile Key
    console_output[5] = Branch  Key
    console_output[6] = Commit  ID
    console_output[7] = Ready

    */
    this.props.fields = [
      [
        // Branch Name
        {
          name: "Branch",
          value:
            console_output[2].substring(console_output[2].indexOf(':') + 2)
            .replace(
              `<${BRANCH}>`,
              hyperlink(
                inlineCode(BRANCH),
                `${git_info.root}/tree/${BRANCH}`
              )
            )
        }
      ]
    ]

    this.props.fields.push(
      [
        // Old Commit ID
        {
          name: "Old Commit",
          value: "" +
            hyperlink(
              inlineCode(COMMITS.current),
              `${git_info.root}/tree/${COMMITS.current}`
            )
        }
      ]
    )

    // If fresh isn't the same as the old current
    if (COMMITS.fresh != COMMITS.current) {
      this.props.fields.push(
        [
          // New Commit ID
          {
            name: "New Commit",
            value: "" +
              hyperlink(
                inlineCode(COMMITS.fresh),
                `${git_info.root}/tree/${COMMITS.fresh}`
              )
          }
        ]
      )
      this.props.fields.push(
        [
          // We updated
          {
            name: "Updated?",
            value: this.profile.emojis.check
          }
        ]
      )
    } else {
      this.props.fields[1][0].name = "Same Commit"
      this.props.fields.push(
        [
          // We didn't update
          {
            name: "Updated?",
            value: this.profile.emojis.nocheck
          }
        ]
      )
    }

    // Entities
    let entities = {
      bot: { name: client.user.name, avatar: client.user.displayAvatarURL(), username: client.user.username },
      user: { name: interaction.user.displayName, avatar: interaction.user.displayAvatarURL(), username: interaction.user.username }
    }
    // Players
    this.props.players = {
      user: entities.user,
      target: entities.bot
    }

    return !this.error
  }
}
