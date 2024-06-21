'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop foreign key constraints from Plans and Tasks tables
 
    await queryInterface.removeConstraint('Tasks', 'tasks_ibfk_2');

    // Drop the tables
    await queryInterface.dropTable('Plans');
    await queryInterface.dropTable('Tasks');
    await queryInterface.dropTable('Applications');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate the tables
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
      },
      App_permit_Open: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      App_permit_toDoList: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      App_permit_Doing: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      App_permit_Done: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });

    await queryInterface.createTable('Plans', {
      Plan_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      Plan_MVP_name: {
        type: Sequelize.STRING,
        allowNull: false,
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    await queryInterface.createTable('Tasks', {
      Task_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      Task_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Task_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      Task_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      Task_state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Task_app_Acronym: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Applications',
          key: 'App_Acronym',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      },
      Task_plan: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });

    // Re-add the foreign key constraints
    await queryInterface.addConstraint('Plans', {
      fields: ['Plan_app_Acronym'],
      type: 'foreign key',
      name: 'plans_ibfk_1',
      references: {
        table: 'Applications',
        field: 'App_Acronym',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('Tasks', {
      fields: ['Task_app_Acronym'],
      type: 'foreign key',
      name: 'tasks_ibfk_1',
      references: {
        table: 'Applications',
        field: 'App_Acronym',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },
};
