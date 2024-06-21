'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Applications', {
      App_Acronym: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        validate: {
          is: /^[a-zA-Z0-9_]+$/ // Only alphanumeric and underscore
        }
      },
      App_Description: {
        type: Sequelize.TEXT,
        allowNull: true, // Optional field
      },
      App_Rnumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          isInt: true,
          min: 1 // Must be positive integer and non-zero
        }
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
        allowNull: true, // Optional field
        references: {
          model: 'Groups',
          key: 'name'
        }
      },
      App_permit_Open: {
        type: Sequelize.STRING,
        allowNull: true, // Optional field
        references: {
          model: 'Groups',
          key: 'name'
        }
      },
      App_permit_toDoList: {
        type: Sequelize.STRING,
        allowNull: true, // Optional field
        references: {
          model: 'Groups',
          key: 'name'
        }
      },
      App_permit_Doing: {
        type: Sequelize.STRING,
        allowNull: true, // Optional field
        references: {
          model: 'Groups',
          key: 'name'
        }
      },
      App_permit_Done: {
        type: Sequelize.STRING,
        allowNull: true, // Optional field
        references: {
          model: 'Groups',
          key: 'name'
        }
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Applications');
  }
};
