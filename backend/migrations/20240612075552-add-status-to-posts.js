'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Posts', 'status', {
      type: Sequelize.ENUM('scheduled', 'in development', 'completed'),
      allowNull: false,
      defaultValue: 'scheduled',
    });

    // Update all existing posts to set the status to 'scheduled'
    await queryInterface.sequelize.query(
      "UPDATE Posts SET status = 'scheduled'"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Posts', 'status');
  }
};
