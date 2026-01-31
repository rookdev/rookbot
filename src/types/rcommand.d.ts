import { ChatInputCommandInteraction, TextBasedChannel } from "discord.js"
import { CommandOption, CommandProps, CommandTestOption } from "./command"
import { EmbedProps } from "./embed"
import { RookClient } from "../classes/objects/rclient.class"
import { RookEmbed } from "../classes/embed/rembed.class"

/**
 * @class
 * @classdesc Describes a Rook-branded Command
 * @this {RookCommand}
 * @public
 */
declare class RookCommand {
  /** Command Name */             name: string
  /** Command Description */      description: string
  /** Command Options */          options?: Array<CommandOption>
  /** Command Category */         category: string
  /** Command Test Options */     testOptions?: any
  /** Default Channel Name */     channelName?: string
  /** Channel to Send to */       channel?: TextBasedChannel
  /** Access Label */             access?: string
  /** Global Permissions */       permissions?: number
  /** Bot Permissions */          botPermissions?: number
  /** User Permissions */         permissiomsRequired?: number
  /** Loaded Client Profile */    profile?: string
  /** Entities to select from */  entities?: any
  /** Players to display */       players?: any
  /** Pages to Send */            pages?: Array<RookEmbed>
  /** Did we get an error? */     error?: boolean
  /** Canned Error Messages */    errors?: Array<string>
  /** Scratchpad */               props: Array<EmbedProps>
  /** Test Independent? */        testIndependent?: boolean
  /** Full? */                    full?: boolean
  /** Ephemeral? */               ephemeral?: boolean

  /**
   * Constructor
   *
   * @param client    - Client Object
   * @param comprops  - Command Properties
   * @param props     - Embed Properties
   *
   * @returns this
   */
  constructor(
    client: RookClient,
    comprops: CommandProps,
    props: EmbedProps
  )

  /**
   * Get Channel to send this to
   *
   * @param client      - Client Object
   * @param interaction - Interaction that called this command
   * @param channelType - Channel Type to locate
   *
   * @returns Promise<TextBasedChannel>
   */
  getChannel(
    client: RookClient,
    interaction?: ChatInputCommandInteraction,
    channelType?: string
  )
  : Promise<TextBasedChannel>

  /**
   * Do the thing!
   *
   * @param client      - Client Object
   * @param interaction - Interaction that called this command
   * @param coptions    - Input Options
   *
   * @returns Promise<boolean | undefined>
   */
  action(
    client: RookClient,
    interaction?: TextBasedChannel,
    coptions?: Array<CommandTestOption>
  )
  : Promise<boolean | undefined>

  /**
   * Pre-flight stuff!
   * @param client      - Client Object
   * @param interaction - Interaction that called this command
   * @param coptions    - Input Options
   *
   * @returns Promise<boolean | undefined>
   */
  build(
    client: RookClient,
    interaction?: ChatInputCommandInteraction,
    coptions?: Array<CommandTestOption>
  )
  : Promise<boolean | undefined>

  /**
   * Defer It!
   *
   * @param interaction - Interaction that called this Command
   *
   * @returns Promise<boolean | undefined>
   */
  handle_deferrment(
    interaction: ChatInputCommandInteraction
  )
  : Promise<boolean | undefined>

  /**
   * Handle It!
   *
   * @param interaction   - Interaction that called this Command
   * @param this_package  - Embed(s) to process
   * @param hasDeferred   - Has this Interaction been deferred?
   *
   * @returns Promise<boolean | undefined>
   */
  handle_interaction(
    interaction: ChatInputCommandInteraction,
    this_package: RookEmbed,
    hasDeferred?: boolean
  )
  : Promise<boolean | undefined>

  /**
   * Print the thing!
   *
   * @param client      - Client Object
   * @param interaction - Interaction that called the Command
   * @param pages       - Pages to print
   *
   * @returns Promise<boolean | undefined>
   */
  print_it(
    client: RookClient,
    interaction: ChatInputCommandInteraction,
    pages: Array<RookEmbed>
  )
  : Promise<boolean | undefined>

  /**
   * Ship the thing!
   *
   * @param interaction - Interaction that called the Command
   * @param independent - Print this one independently?
   * @param hasDeferred - Has this Interaction been Deferred?
   *
   * @returns Promise<boolean | undefined>
   */
  ship_it(
    interaction: ChatInputCommandInteraction,
    independent?: boolean,
    hasDeferred?: boolean
  )
  : Promise<boolean | undefined>

  /**
   * Send the thing!
   *
   * @param client      - Client Object
   * @param interaction - Interaction that called the Command
   * @param pages       - Pages to Send
   * @param independent - Print this batch independently?
   * @param hasDeferred - Has this Interaction been deferred?
   *
   * @returns Promise<boolean | undefined>
   */
  send(
    client: RookClient,
    interaction: ChatInputCommandInteraction,
    pages: Array<RookEmbed>,
    independent?: boolean,
    hasDeferred?: boolean
  )
  : Promise<boolean | undefined>

  /**
   * Run the thing!
   *
   * @param client      - Client Object
   * @param interaction - Interaction that called the Command
   * @param options     - Input Options
   *
   * @returns Promise<boolean | undefined>
   */
  execute(
    client: RookClient,
    interaction?: ChatInputCommandInteraction,
    coptions?: any,
    independent?: boolean
  )
  : Promise<boolean | undefined>

  /**
   * Test the thing!
   *
   * @param client      - Client Object
   * @param interaction - Interaction that called the Command
   *
   * @returns Promise<boolean | undefined>
   */
  test(
    client: RookClient,
    interaction: ChatInputCommandInteraction
  )
  : Promise<boolean | undefined>
}

export { RookCommand }
