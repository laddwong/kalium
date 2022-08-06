
const args = require('minimist')(process.argv.slice(2))
const { build } = require('esbuild');
const fs = require('fs');
const { resolve } = require('path');

/** 获取包名列表 */
const getPackages = () => {
  return new Promise((resolve, reject) => {
    fs.readdir('./packages', (err, data) => {
      // console.log('getPackages ->', data);
      resolve(data)
    })
  })
}

/** esbuild */
const buildPack = (name, format) => {
  const entryPoints = [resolve(__dirname, `../packages/${name}/src/index.ts`)]
  const outfile = resolve(__dirname, `../packages/${name}/dist/${name}.${format}.js`)
  const packageConf = require(resolve(__dirname, `../packages/${name}/package.json`))
  return build({
    entryPoints,
    outfile,
    bundle: true,
    sourcemap: true,
    format: 'iife',
    globalName: packageConf.buildOptions?.name,
    platform: 'browser',
    watch: {
      onRebuild(error) {
        if(!error) return console.log(`重新打包完成`);
        console.error(`重新打包失败`);
      }
    }
  })
}

const packNameToBuild = args.name;
const formatToBuild = args.format || 'global';
// console.log('args ->', args);
getPackages()
  .then(packages => {
    if(!packages.includes(packNameToBuild)) return Promise.reject('找不到包');
    return buildPack(packNameToBuild, formatToBuild)
  })
  .then(() => {
    console.log(`打包完成，监听中`);
  })
  .catch(err => {
    console.error(err);
  })