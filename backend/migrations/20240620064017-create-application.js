'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Applications', {
      App_Acronym: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      App_Description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      App_Rnumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      App_startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      App_endDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      App_permit_Create: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Groups',
          key: 'name',
        },
      },
      App_permit_Open: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Groups',
          key: 'name',
        },
      },
      App_permit_toDoList: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Groups',
          key: 'name',
        },
      },
      App_permit_Doing: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Groups',
          key: 'name',
        },
      },
      App_permit_Done: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Groups',
          key: 'name',
        },
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Applications');
  },
};
