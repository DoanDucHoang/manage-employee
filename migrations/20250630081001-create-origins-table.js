'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  db.createTable('origins', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    origin_name: { type: 'string', length: 100, notNull: true, unique: true },
    created_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('origins', callback);
};


exports._meta = {
  "version": 1
};
