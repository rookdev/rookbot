// Utility function to map an array by its 'name' property for quick lookups
const mapByName = (array) => {
  const map = new Map()
  array?.forEach((item) => map.set(item.name, item))
  return map
}

// Function to check if choices are different
const areChoicesDifferent = (existingChoices, localChoices) => {
  const existingMap = mapByName(existingChoices)

  for (const localChoice of localChoices) {
    const existingChoice = existingMap.get(localChoice.name)
    if (!existingChoice || localChoice.value !== existingChoice.value) {
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
      !existingOption || // Option missing
      localOption.description !== existingOption.description || // Description mismatch
      localOption.type !== existingOption.type || // Type mismatch
      (localOption.required || false) !== existingOption.required || // Required flag mismatch
      (localOption.choices?.length || 0) !== (existingOption.choices?.length || 0) || // Choice count mismatch
      areChoicesDifferent(localOption.choices || [], existingOption.choices || []) // Choice values mismatch
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

  if (
    existingCommand.description !== localCommand.description || // Description mismatch
    existingCommand.options?.length !== (localCommand.options?.length || 0) || // Option count mismatch
    areOptionsDifferent(existingCommand.options || [], localCommand.options || []) // Option details mismatch
  ) {
    return true
  }

  return false
}
