const monthNumberToString = (n, shortString) => {
  if (shortString) {
    return [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ][n]
  }
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][n]
}

const dayNumberToString = (n, shortString) => {
  if (shortString) {
    return [
      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
    ][n]
  }
  return [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ][n]
}

const formatDate = (dateOrString, format) => {
  let date
  if (typeof dateOrString === 'string') {
    date = new Date(dateOrString)
  } else if (dateOrString) {
    date = dateOrString
  } else {
    date = new Date()
  }

  const replacements = {
    j: () => date.getDate(),
    d: () => pad(date.getDate(), 2),
    N: () => date.getDay() + 1,
    l: () => dayNumberToString(date.getDay()),
    D: () => dayNumberToString(date.getDay(), true),
    Y: () => date.getFullYear(),
    n: () => date.getMonth() + 1,
    m: () => pad(date.getMonth() + 1, 2),
    F: () => monthNumberToString(date.getMonth()),
    M: () => monthNumberToString(date.getMonth(), true),
    G: () => date.getHours(),
    H: () => pad(date.getHours(), 2),
    i: () => pad(date.getMinutes(), 2),
    s: () => pad(date.getSeconds(), 2),
  }

  let ret = ''
  let skipNext = false
  let replaced = false
  let char
  let magicChar
  let replacement

  for (let i = 0; i < format.length; i ++) {
    char = format[i]
    if (skipNext) {
      ret += char
      skipNext = false
      continue
    }

    replaced = false

    if (char === '\\') {
      skipNext = true
      continue
    }

    for (magicChar in replacements) {
      replacement = replacements[magicChar]
      if (magicChar === char) {
        ret += replacement()
        replaced = true
        break
      }
    }

    if (!replaced) {
      ret += char
    }
  }
  return ret
}

module.exports = formatDate
