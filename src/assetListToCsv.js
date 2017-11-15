const contentful = require('contentful-management');
const fs = require('fs');
const json2csv = require('json2csv');
const chalk = require('chalk');
const path = require('path')

const outputFileName = 'ECP_assets_list.csv';
const log = console.log;
const spaceId = process.env.npm_config_space_id;
const token = process.env.npm_config_access_token;

const getChunkAssets = (space, currentIndex=0, holder=[]) => {
  return space.getAssets({
    skip: currentIndex,
    limit:500
  }).then((response) => {
      const items = response.items;
      const skip = currentIndex + items.length;
      const newholder = holder.concat(items);
      if(skip < response.total) {
        return getChunkAssets(space, skip, newholder)
      } else {
        return newholder;
      }
  })
}

const mapAssetNameUrl = (asset) => ({
  name: asset.fields.file['en-CA'].fileName,
  url: asset.fields.file['en-CA'].url
})

const filterOutInvalidAsset = (asset) => !asset.isDraft();

const writeCsv = (data) => {
  const fields = ['name', 'url'];
  try {
    const result = json2csv({ data, fields });
    fs.writeFile(outputFileName, result, function(err) {
      if (err) throw err;
      log(chalk.greenBright.bold(`File created: ${path.resolve(__dirname, '../', outputFileName)}`));
    });
  } catch (err) {
    throw err;
  }
}

const getAllAssets = (space) => {
  log(chalk.greenBright.bold('Fetching assets...'));
  getChunkAssets(space, 0, [])
  .then(assets => assets.filter(filterOutInvalidAsset).map(mapAssetNameUrl))
  .then(mappedAssets => {
    log(chalk.greenBright.bold('Fetching assets completed'));
    log(chalk.greenBright.bold('Generating CSV file...'));
    return writeCsv(mappedAssets)
  });
}


if(!spaceId) {
  log(chalk.redBright.bold('Space id missing!'));
  process.exit(1);
}
if(!token) {
  log(chalk.redBright.bold('Management token missing!'));
  process.exit(1);
}

const client = contentful.createClient({
  accessToken: token
})

client.getSpace(spaceId)
.then(getAllAssets)
.catch(console.error)