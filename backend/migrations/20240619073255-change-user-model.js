'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Describe the 'UserGroups' table to check for foreign key constraints
    const userGroupTableDefinition = await queryInterface.describeTable('UserGroups');

    // Remove foreign key constraints if they exist
    if (userGroupTableDefinition.userId) {
      await queryInterface.removeConstraint('UserGroups', 'usergroups_ibfk_1');
    }
    if (userGroupTableDefinition.groupId) {
      await queryInterface.removeConstraint('UserGroups', 'usergroups_ibfk_2');
    }

    // Remove the 'id' column from 'Users' table if it exists
    const userTableDefinition = await queryInterface.describeTable('Users');
    if (userTableDefinition.id) {
      await queryInterface.removeColumn('Users', 'id');
    }

    // Change 'username' column to be the primary key
    await queryInterface.changeColumn('Users', 'username', {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Add the 'id' column back to 'Users' table
    await queryInterface.addColumn('Users', 'id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    });

    // Change 'username' column to not be the primary key
    await queryInterface.changeColumn('Users', 'username', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Recreate foreign key constraints
    await queryInterface.addConstraint('UserGroups', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'usergroups_ibfk_1',
      references: {
        table: 'Users',
        field: 'username',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
    await queryInterface.addConstraint('UserGroups', {
      fields: ['groupId'],
      type: 'foreign key',
      name: 'usergroups_ibfk_2',
      references: {
        table: 'Groups',
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
};
