'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Groups', ['name'], {
      unique: true,
      name: 'unique_name_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Groups', 'unique_name_index');
  },
};
