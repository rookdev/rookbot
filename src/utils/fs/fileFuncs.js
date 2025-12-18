const path = require('path')
const fs = require('fs')

function getAPath(directory=[], filename="") {
  let dirpath = ""
  if (
    directory[0] &&
    (
      directory[0].includes(`home${path.sep}minerva`) ||
      directory[0].includes(`home${path.sep}runner`) ||
      directory[0].includes(`opt${path.sep}rookbot`) ||
      directory[0].includes(`opt${path.sep}minrook`) ||
      directory[0].includes(`:${path.sep}`) ||
      directory[0].includes(`:${path.sep}${path.sep}`)
    )
  ) {
    dirpath = path.join(...directory)
  } else {
    dirpath = path.join(process.cwd(),...directory)
  }

  return path.join(dirpath,filename)
}

function getAFile(directory=[], filename="") {
  let filepath = getAPath(directory, filename)
  if (fs.existsSync(filepath)) {
    if (
      filepath.endsWith(".json") ||
      filepath.endsWith(".js")
    ) {
      return require(
        filepath
          .replace(".json","")
          .replace(".js","")
      )
    } else {
      return fs.readFileSync(filepath, { encoding: "utf-8" })
    }
  }

  return false
}

function getAllFiles(directory, foldersOnly=false) {
  let fileNames = []

  if (typeof directory != "object") {
    directory = [ directory ]
  }

  if (!getAPath(directory)) {
    return fileNames
  }

  const files = fs.readdirSync(
    getAPath(directory),
    { withFileTypes: true }
  )

  for (const file of files) {
    const filePath = getAPath(
      directory,
      file.name
    )

    if (foldersOnly) {
      if (file.isDirectory()) {
        fileNames.push(filePath)
      }
    } else {
      if (file.isFile()) {
        fileNames.push(filePath)
      }
    }
  }

  // console.log(
  //   directory,
  //   getAPath(directory),
  //   fileNames
  // )

  return fileNames
}

module.exports = {
  getAFile,
  getAPath,
  getAllFiles
}
