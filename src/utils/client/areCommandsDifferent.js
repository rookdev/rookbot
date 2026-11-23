// Utility function to map an array by its 'name' property for quick lookups
const mapByName = (array) => {
  const map = new Map()
  array?.forEach((item) => map.set(item.name, item))
  return map
}

// Function to check if counts are different
const areCountsDifferent = (existingItems, localItems) => {
  let existingCount = existingItems?.length ?? 0
  let localCount    = localItems?.length    ?? 0

  if (existingCount && (!localCount)) {
    return true
  }
  if ((!existingCount) && localCount) {
    return true
  }
  if (existingCount !== localCount) {
    // console.log(existingCount, localCount)
  }

  return false
}

// Function to check if choices are different
const areChoicesDifferent = (existingChoices, localChoices) => {
  const existingMap = mapByName(existingChoices)

  for (const localChoice of localChoices) {
    const existingChoice = existingMap.get(localChoice.name)
    if (
      // Choice missing
        !existingChoice ||
      // Value mismatch
        (existingChoice.value !== localChoice.value) ||
      false
    ) {
      return true
    }
  }

  return false
}

// Function to check if options are different
const areOptionsDifferent = (existingOptions, localOptions) => {
  const existingMap = mapByName(existingOptions)

  for (const localOption of localOptions) {
    const existingOption = existingMap.get(localOption.name)

    if (
      // Option missing
        !existingOption ||
      // Description mismatch
        (existingOption.description !== localOption.description) ||
      // Type mismatch
        (existingOption.type !== localOption.type) ||
      // Required flag mismatch
        (existingOption.required !== (localOption.required || false)) ||
      // Choice count mismatch
        areCountsDifferent(existingOption.choices, localOption.choices) ||
      // Choice values mismatch
        areChoicesDifferent(existingOption.choices || [], localOption.choices || []) ||
      false
    ) {
      return true
    }
  }

  return false
}

// Function to check if subcommands are different
const areSubcommandsDifferent = (existingSubcommands, localSubcommands) => {
  const existingMap = mapByName(existingSubcommands)

  for (const localSub of localSubcommands) {
    const existingSub = existingMap.get(localSub.name)

    if(
      // Subcommand missing
        !existingSub ||
      // Description mismatch
        (localSub.description !== existingSub.description) ||
      false
    ) {
      return true
    }
  }
  return false
}

// Main function to compare commands
module.exports = (existingCommand, localCommand) => {
  if (!existingCommand || !localCommand) {
    throw new Error('Both existingCommand and localCommand must be provided')
  }

  // if (existingCommand.description !== localCommand.description) {
  //   console.log(
  //     existingCommand.name,
  //     "Description mismatch",
  //     JSON.stringify(existingCommand.description.split(" ").slice(-2)),
  //     JSON.stringify(localCommand.description.split(" ").slice(-2))
  //   )
  // }

  if (
    // Description mismatch
      (existingCommand.description !== localCommand.description) ||
    // Option count mismatch
      areCountsDifferent(existingCommand.options, localCommand.options) ||
    // Subcommand count mismatch
      areCountsDifferent(existingCommand.subcommands, localCommand.subcommands) ||
    // Option details mismatch
      areOptionsDifferent(existingCommand.options || [], localCommand.options || []) ||
    // Subcommand details mismatch
      areSubcommandsDifferent(existingCommand.subcommands || [], localCommand.subcommands || []) ||
    false
  ) {
    return true
  }

  return false
}
