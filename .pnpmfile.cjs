// Allow build scripts for required native modules
function readPackage(pkg) {
  return pkg
}

module.exports = { hooks: { readPackage } }
