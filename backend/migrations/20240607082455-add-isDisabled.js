'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the isDisabled column
    await queryInterface.addColumn('Users', 'isDisabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Update existing entries to set isDisabled to false
    await queryInterface.sequelize.query('UPDATE Users SET isDisabled = false WHERE isDisabled IS NULL');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the isDisabled column
    await queryInterface.removeColumn('Users', 'isDisabled');
  }
};
