module.exports = (ms = 0) => {
  const portions = []
  const msInSec = 1000
  const msInMin = msInSec * 60
  const msInHour = msInMin * 60
  const msInDay = msInHour * 24

  const days = Math.trunc(ms / msInDay)
  if (days > 0) {
    portions.push(days + 'd')
    ms -= (days * msInDay)
  }

  const hours = Math.trunc(ms / msInHour)
  if (hours > 0) {
    portions.push(hours + 'h')
    ms -= (hours * msInHour)
  }

  const minutes = Math.trunc(ms / msInMin)
  if (minutes > 0) {
    portions.push(minutes + 'm')
    ms -= (minutes * msInMin)
  }

  const seconds = Math.trunc(ms / msInSec)
  if (seconds > 0) {
    portions.push(seconds + 's')
  }
  return portions.join(' ')
}
