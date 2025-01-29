function myRand(min=0, max=1) {
  if (min > max) {
    let tmp = min
    min = max
    max = tmp
  }
  return Math.floor(Math.random() * max)
}

function roll(sides=2,dice=1) {
  let result = 0
  for (let i = 0; i < dice; i++) {
    let thisRoll = myRand(sides)
    result += thisRoll
  }
  return result
}

function randPick(input) {
  if (typeof input == "string") {
    input = [input]
  }
  if (!input?.length) {
    return "Error: Invalid input"
  }
  if (input.length <= 0) {
    return "Error: Length too short"
  }

  return input[myRand(0, input.length)]
}

module.exports = {
  myRand,
  roll,
  randPick
}
