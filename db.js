var db = require('monk')('localhost:3001/meteor');
var HotLoaderColl = db.get('hotloader');

module.exports = {
  HotLoaderColl: HotLoaderColl
};
