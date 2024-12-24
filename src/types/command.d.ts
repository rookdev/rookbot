export type CommandOption = {
  /** Option Name         */ name: string
  /** Option Description  */ description: string
  /** Option Type         */ type: string
  /** Required?           */ required?: boolean
}
export type CommandTestOption = {
  [key: string]: any
}
// Members of RookCommand
export type CommandProps = {
  /** Command Name */               name: string
  /** Command Description */        description: string
  /** Command Options */            options?: Array<CommandOption>
  /** Command Category */           category?: string
  /** Command Default Channel */    channelName?: string
  /** Command Global Permissions */ permissions?: number
  /** Command User Permissions */   permissionsRequired?: number
  /** Command Bot Permissions */    botPermissions?: number
  /** Command Access Label */       access?: string
  /** Command Test Options */       testOptions?: Array<CommandTestOption>
  /** Test Independent? */          testIndependent?: boolean
}
