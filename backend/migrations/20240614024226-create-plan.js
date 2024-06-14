'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Plans', {
      Plan_MVP_name: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      Plan_startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      Plan_endDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      Plan_app_Acronym: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Applications',
          key: 'App_Acronym',
        },
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Plans');
  },
};
