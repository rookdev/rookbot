const numFuncs = require('../primitives/numFuncs')

module.exports = (ms = 0) => {
  const portions = []

  if (numFuncs.myIsNumeric(ms)) {
    let durations = {}
    durations.ms  = 1
    durations.s   = durations.ms * 1000
    durations.m   = durations.s  *   60
    durations.h   = durations.m  *   60
    durations.d   = durations.h  *   24
    durations.wk  = durations.d  *    7
    durations.mo  = durations.d  *   30
    durations.yr  = durations.mo *   12

    let keys = Object.keys(durations);
    keys = keys.sort(function(a,b){return durations[b]-durations[a]});

    for (let key of keys) {
      const units = Math.trunc(ms / durations[key])
      if (units > 0) {
        portions.push(units + key)
        ms -= (units * durations[key])
      }
    }
  } else {
    portions.push(`Invalid input: ${ms}`)
  }

  return portions.join(' ')
}
