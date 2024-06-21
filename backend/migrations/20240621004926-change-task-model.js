'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tasks', {
      Task_id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      Task_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Task_description: {
        type: Sequelize.TEXT,
      },
      Task_notes: {
        type: Sequelize.TEXT,
      },
      Task_app_Acronym: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Applications',
          key: 'App_Acronym'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      Task_plan: {
        type: Sequelize.STRING,
      },
      Task_state: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'open'
      },
      Task_creator: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Task_owner: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Task_createDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tasks');
  }
};
