const { BotDevCommand } = require('../../classes/command/botdevcommand.class.js')
const shell = require('shelljs')
const fs = require('fs')

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
  async action(client, interaction, coptions={}) {
    let BRANCH = ""
    let COMMITS = {
      current: "",
      latest: "",
      new: ""
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
      let git_log = shell.exec(
        "git log -1",
        { silent: true }
      )
      git_log = git_log.stdout.trim()
      let commits = git_log.split("\n")
      let latest_commit = commits[0 * 6]
      COMMITS.current = latest_commit.match(/^(?:[^\s]+)(?:[\s])([^\s]{7})/)
      if (COMMITS.current && (COMMITS.current.length > 0)) {
        COMMITS.current = COMMITS.current[1]
      }
    } catch (err) {
      console.log(err.stack)
    }

    if (!this.DEV) {
      // Checkout
      try {
        shell.exec("git checkout main")
      } catch(err) {
        console.log(err.stack)
      }
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
      let git_log = shell.exec(
        "git log -2",
        { silent: true }
      )
      git_log = git_log.stdout.trim()
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

    let user = client?.user

    let console_output = [
      "---"
    ]

    console_output.push(
      "Updating " +
      (user ? user.username : "") +
      ` v${this.profile.PACKAGE.version}!`
    )
    this.props = {
      title: {
        text: console_output[1],
        emoji: "⏫",
        url: "https://github.com/mysterypaintwo/rookbot"
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
        {
          name: "Branch",
          value:
            console_output[2].substring(console_output[2].indexOf(':') + 2)
            .replace(
              `<${BRANCH}>`,
              `[\`${BRANCH}\`](https://github.com/mysterypaintwo/rookbot/tree/${BRANCH})`
            )
        }
      ]
    ]

    this.props.fields.push(
      [
        {
          name: "Old Commit",
          value: `[\`${COMMITS.current}\`](https://github.com/mysterypaintwo/rookbot/tree/${COMMITS.current})`
        }
      ]
    )

    // If fresh isn't the same as the old current
    if (COMMITS.fresh != COMMITS.current) {
      this.props.fields.push(
        [
          {
            name: "New Commit",
            value: `[\`${COMMITS.fresh}\`](https://github.com/mysterypaintwo/rookbot/tree/${COMMITS.fresh})`
          }
        ]
      )
      this.props.fields.push(
        [
          {
            name: "Updated?",
            value: "Yes"
          }
        ]
      )
    } else {
      this.props.fields[1][0].name = "Same Commit"
      this.props.fields.push(
        [
          {
            name: "Updated?",
            value: "No"
          }
        ]
      )
    }

    // Entities
    let entities = {
      bot: { name: client.user.name, avatar: client.user.avatarURL(), username: client.user.username },
      user: { name: interaction.user.displayName, avatar: interaction.user.avatarURL(), username: interaction.user.username }
    }
    // Players
    this.props.players = {
      user: entities.user,
      target: entities.bot
    }

    return !this.error
  }
}
