'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Truncate the Users table
    await queryInterface.sequelize.query('TRUNCATE TABLE `Users`');

    // Add email column
    await queryInterface.addColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    // Add role column
    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user', 'isDisabled'),
      allowNull: false,
      defaultValue: 'user',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove email column
    await queryInterface.removeColumn('Users', 'email');

    // Remove role column
    await queryInterface.removeColumn('Users', 'role');
  }
};

