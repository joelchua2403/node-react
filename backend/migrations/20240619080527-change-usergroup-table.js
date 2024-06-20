'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Drop all rows in the UserGroups table
      await queryInterface.bulkDelete('UserGroups', null, { transaction });

      // Remove the userId column
      await queryInterface.removeColumn('UserGroups', 'userId', { transaction });

      // Add the username column
      await queryInterface.addColumn('UserGroups', 'username', {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'username'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // Repopulate the UserGroups table with the admin user
      const adminUser = await queryInterface.sequelize.query(
        `SELECT username FROM Users WHERE username = 'admin'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (adminUser.length > 0) {
        await queryInterface.bulkInsert('UserGroups', [{
          username: 'admin',
          groupId: 1, // Replace with the appropriate groupId
          createdAt: new Date(),
          updatedAt: new Date()
        }], { transaction });
      }

      if (adminUser.length > 0) {
        await queryInterface.bulkInsert('UserGroups', [{
          username: 'admin',
          groupId: 4, // Replace with the appropriate groupId
          createdAt: new Date(),
          updatedAt: new Date()
        }], { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Drop all rows in the UserGroups table
      await queryInterface.bulkDelete('UserGroups', null, { transaction });

      // Remove the username column
      await queryInterface.removeColumn('UserGroups', 'username', { transaction });

      // Add the userId column
      await queryInterface.addColumn('UserGroups', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // Repopulate the UserGroups table with the admin user
      const adminUser = await queryInterface.sequelize.query(
        `SELECT id FROM Users WHERE username = 'admin'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (adminUser.length > 0) {
        await queryInterface.bulkInsert('UserGroups', [{
          userId: adminUser[0].id,
          groupId: 1, // Replace with the appropriate groupId
          createdAt: new Date(),
          updatedAt: new Date()
        }], { transaction });
      }
    });
  }
};
