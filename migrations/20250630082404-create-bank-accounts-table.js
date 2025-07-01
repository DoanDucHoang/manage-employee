'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  db.createTable('bank_accounts', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    employee_code: {
      type: 'string', notNull: true,
      foreignKey: {
        name: 'fk_bank_accounts_employee_code',
        table: 'users',
        mapping: 'employee_code',
        rules: { onDelete: 'CASCADE' }
      }
    },
    bank_name: { type: 'string', length: 100, notNull: true },
    account_number: { type: 'string', length: 50, notNull: true, unique: true },
    account_holder: { type: 'string', length: 100, notNull: true },
    created_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', defaultValue: new String('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('bank_accounts', callback);
};


exports._meta = {
  "version": 1
};
