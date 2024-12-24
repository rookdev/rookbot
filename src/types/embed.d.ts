
export type EmbedAuthor = {
  /** Author Name */      text: string
  /** Author Image URL */ image?: string
  /** Author Link URL */  url?: string
}
export type EmbedThumbnail = {
  /** Thumbnail URL */  image: string
}
export type EmbedTitle = {
  /** Title Text */   text: string
  /** Title Emoji */  emoji?: string
  /** Title URL */    url?: string
}
export type EmbedField = {
  /** Field Name */   name: string
  /** Field Value */  value: string
  /** Inline? */      inline?: boolean
}
export type EmbedImage = {
  /** Image URL */  image: string
}
export type EmbedFooter = {
  /** Footer Text */      text: string
  /** Footer Image URL */ image?: string
}
export type EmbedPlayer = {
  /** Player Name */    name: string
  /** Player URL */     url: string
  /** Player Avatar */  avatar: string
}
// Members of RookEmbed
export type EmbedProps = {
  /** Embed Stripe Color */ color?: ColorResolvable | string
  /** Embed Author */       author?: EmbedAuthor
  /** Embed Thumbnail */    thumbnail?: EmbedThumbnail
  /** Embed Caption */      caption?: EmbedTitle
  /** Embed Title */        title?: EmbedTitle
  /** Embed Description */  description?: string | Array<string>
  /** Embed Fields */       fields?: Array<Array<EmbedField>>
  /** Embed Image */        image?: EmbedImage
  /** Embed Footer */       footer?: EmbedFooter
  /** Embed Timestamp */    timestamp?: number | boolean
  /** Embed Players */      players?: any
  /** Embed Flags */        flags?: number
  /** Null? */              null?: boolean
  /** Ephemeral? */         ephemeral?: boolean
  /** Full? */              full?: boolean
}
