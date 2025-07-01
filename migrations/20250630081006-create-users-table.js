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
  db.createTable('users', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    employee_code: { type: 'string', length: 100, notNull: true, unique: true },
    full_name: { type: 'string', length: 255, notNull: true },
    phone: { type: 'string', length: 20, notNull: true, unique: true },
    email: { type: 'string', length: 100, notNull: true, unique: true },
    id_number: { type: 'string', length: 20, notNull: true, unique: true },
    id_front_image: { type: 'string', length: 255, notNull: true },
    id_back_image: { type: 'string', length: 255, notNull: true },
    id_front_thumb: { type: 'string', length: 255, notNull: true },
    id_back_thumb: { type: 'string', length: 255, notNull: true },
    origin_id: {
      type: 'int', notNull: true,
      foreignKey: {
        name: 'fk_users_origin_id',
        table: 'origins',
        mapping: 'id',
        rules: { onDelete: 'CASCADE' }
      }
    },
    current_address: { type: 'string', length: 255, notNull: true },
    day_of_birth: { type: 'date', notNull: true },
    graduated_from_id: {
      type: 'int',
      foreignKey: {
        name: 'fk_users_graduated_from_id',
        table: 'graduated_from',
        mapping: 'id',
        rules: { onDelete: 'CASCADE' }
      }
    },
    position_id: {
      type: 'int', notNull: true,
      foreignKey: {
        name: 'fk_users_position_id',
        table: 'positions',
        mapping: 'id',
        rules: { onDelete: 'CASCADE' }
      }
    },
    salary: { type: 'int', notNull: true },
    status_id: {
      type: 'int', notNull: true,
      foreignKey: {
        name: 'fk_users_status_id',
        table: 'status',
        mapping: 'id',
        rules: { onDelete: 'CASCADE' }
      }
    },
    start_date: { type: 'date', notNull: true },
    is_deleted: { type: 'boolean', defaultValue: false },
    created_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('users', callback);
};


exports._meta = {
  "version": 1
};
