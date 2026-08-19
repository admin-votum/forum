const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const templateFile = path.join(
  projectRoot,
  'bskyweb',
  'templates',
  'scripts.html',
)

const {entrypoints} = require(
  path.join(projectRoot, 'web-build/asset-manifest.json'),
)

console.log(`Found ${entrypoints.length} entrypoints`)
console.log(`Writing ${templateFile}`)

const outputFile = entrypoints
  .map(name => {
    const file = path.basename(name)
    const ext = path.extname(file)

    if (ext === '.js') {
      return `<script defer="defer" src="{{ staticCDNHost }}/static/js/${file}"></script>`
    }
    if (ext === '.css') {
      return `<link rel="stylesheet" href="{{ staticCDNHost }}/static/css/${file}">`
    }

    return ''
  })
  .join('\n')
fs.writeFileSync(templateFile, outputFile)

const manifestFile = path.join(projectRoot, 'web-build', 'manifest.json')
if (fs.existsSync(manifestFile)) {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
  delete manifest.related_applications
  delete manifest.prefer_related_applications
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`)
}

function copyFiles(sourceDir, targetDir) {
  const sourcePath = path.join(projectRoot, sourceDir)
  if (!fs.existsSync(sourcePath)) return

  const targetPath = path.join(projectRoot, targetDir)
  fs.mkdirSync(targetPath, {recursive: true})
  const files = fs.readdirSync(sourcePath)
  files.forEach(file => {
    const sourceFile = path.join(sourcePath, file)
    const targetFile = path.join(targetPath, file)
    fs.copyFileSync(sourceFile, targetFile)
    console.log(`Copied ${sourceFile} to ${targetFile}`)
  })
}

copyFiles('web-build/static/js', 'bskyweb/static/js')
copyFiles('web-build/static/css', 'bskyweb/static/css')
copyFiles('web-build/static/media', 'bskyweb/static/media')
