import { EmbedBuilder } from "discord.js";
import { EmbedProps } from "./embed";
import { RookClient } from "../classes/objects/rclient.class";

/**
 * @class
 * @classdesc Build a Rook-branded Embed
 * @this {RookEmbed}
 * @public
 */
declare class RookEmbed extends EmbedBuilder {
  /** Embed Properties */ props: EmbedProps

  /**
   * Initialize Embed Object
   *
   * @param client  - Client Object
   *
   * @returns
   */
  init(
    client: RookClient
  )
  : void

  /**
   * Constructor
   *
   * @param client  - Client Object
   * @param props   - Embed Properties
   *
   * @returns this
   */
  constructor(
    client: RookClient,
    props: EmbedProps
  )
}

export { RookEmbed }
