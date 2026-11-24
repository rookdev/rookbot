// @ts-nocheck

// Command Option Types, Formatters: codeBlock
const { ApplicationCommandOptionType, codeBlock } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class ColorCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "color",
      category: "misc",
      description: "Displays information about a hex color code",
      flags: {
        domain: [
          "bot",
          "guild"
        ]
      },
      options: [
        {
          name: "hex",
          description: "A hex color code (e.g., #FF5733 or FF5733)",
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ],
      testOptions: [
        { hex: "FFAF00" },
        { hex: "c8a0c8" },
        { hex: "#FFAF00" },
        { hex: "#c8a0c8" }
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

  async hex2hsl(hex) {
    // https://www.jameslmilner.com/posts/converting-rgb-hex-hsl-colors/#hex-to-hsl
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (!result) {
      // throw new Error("Could not parse Hex Color");
      return { h: 0, s: 0, l: 0}
    }

    const rHex = parseInt(result[1], 16)
    const gHex = parseInt(result[2], 16)
    const bHex = parseInt(result[3], 16)

    const r = rHex / 255
    const g = gHex / 255
    const b = bHex / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)

    let h = (max + min) / 2
    let s = h
    let l = h

    if (max === min) {
      // Achromatic
      return { h: 0, s: 0, l }
    }

    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break
      case g:
        h = (b - r) / d + 2;
        break
      case b:
        h = (r - g) / d + 4;
        break
    }
    h /= 6

    s = s * 100
    s = Math.round(s)
    l = l * 100
    l = Math.round(l)
    h = Math.round(360 * h)

    return { h, s, l }
  }
  async hsl2hsv(h, s=null, l=null) {
    // https://stackoverflow.com/a/17243070
    if (typeof h === "object") {
      if ("s" in h) {
        s = h.s
      }
      if ("l" in h) {
        l = h.l
      }
      if ("h" in h) {
        h = h.h
      }
    }

    let _h = h
    let _s = null
    let _v = null

    l *= 2
    s *= (l <= 1) ? l : 2 - l
    _v = (l + s) / 2
    _s = (2 * s) / (l + s)

    return {
      h: _h,
      s: _s,
      v: _v
    }
  }
  async hex2hsv(hex) {
    return await this.hsl2hsv(
      await this.hex2hsl(hex)
    )
  }
  async rgb2cmyk(r, g, b) {
    r = r / 255
    g = g / 255
    b = b / 255

    const k = +(1 - Math.max(r, g, b)).toFixed(1)
    const c = +((1 - r - k) / (1 - k) || 0).toFixed(1)
    const m = +((1 - g - k) / (1 - k) || 0).toFixed(1)
    const y = +((1 - b - k) / (1 - k) || 0).toFixed(1)

    return {
      c,
      m,
      y,
      k
    }
  }

  async action(client, interaction, coptions) {
    // Get hex color input
    const hexInput = coptions.hex.replace('#', '').toUpperCase()

    // Validate hex string
    const hexRegex = /^[0-9A-F]{6}$/
    if (!hexRegex.test(hexInput)) {
      this.error = true
      this.props.description = "Invalid hex color code. Please provide a valid 6-character hexadecimal string (e.g., #FF5733 or FF5733)."
      return !this.error
    }

    // Convert hex to RGB
    const r = parseInt(hexInput.substring(0, 2), 16)
    const g = parseInt(hexInput.substring(2, 4), 16)
    const b = parseInt(hexInput.substring(4, 6), 16)
    let dims = "50x50"

    // Create the embed
    this.props = {
      color: `${hexInput}`,
      title: {
        text: "Color Information"
      },
      image: { image: `https://png-pixel.com/${dims}-${hexInput.toLowerCase()}ff.png` },
      fields: [
        [
          { name: 'Hex',  value: codeBlock(`#${hexInput}`) },
          { name: 'RGB',  value: codeBlock(`(${r}, ${g}, ${b})`) },
          { name: 'HSL', value: codeBlock("(" + Object.values(await this.hex2hsl(hexInput)).join(", ") + ")") }
        ],
        [
          { name: 'CMYK', value: codeBlock("(" + Object.values(await this.rgb2cmyk(r, g, b)).join(", ") + ")") }
        ],
        [
          { name: 'HSV', value: codeBlock("(" + Object.values(await this.hex2hsv(hexInput)).join(", ") + ")") }
        ]
      ]
    }

    return !this.error
  }
}
