'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tasks', {
      Task_name: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      Task_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      Task_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      Task_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Applications',
          key: 'App_Acronym',
        },
      },
      Task_plan: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Plans',
          key: 'Plan_MVP_name',
        },
      },
      Task_app_Acronym: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Applications',
          key: 'App_Acronym',
        },
      },
      Task_state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Task_creator: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'username',
        },
      },
      Task_owner: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'username',
        },
      },
      Task_createDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tasks');
  },
};
