function truncateWithDots(str, length) {
  return str.slice(0, length - 1) + "...";
}

module.exports = {
  truncateWithDots: truncateWithDots
}
