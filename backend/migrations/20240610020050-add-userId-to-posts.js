'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Drop all rows in the Posts table
    await queryInterface.bulkDelete('Posts', null, {});

    // Step 2: Add the userId column without foreign key constraint
    await queryInterface.addColumn('Posts', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Temporarily allow null for the update
    });

    // Step 3: Remove the username column
    await queryInterface.removeColumn('Posts', 'username');

    // Step 4: Change userId column to not allow nulls
    await queryInterface.changeColumn('Posts', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Step 5: Add foreign key constraint
    await queryInterface.addConstraint('Posts', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_posts_userId', // Name your constraint
      references: {
        table: 'Users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Step 6: Remove the foreign key constraint
    await queryInterface.removeConstraint('Posts', 'fk_posts_userId');

    // Step 7: Remove the userId column
    await queryInterface.removeColumn('Posts', 'userId');

    // Step 8: Add the username column back
    await queryInterface.addColumn('Posts', 'username', {
      type: Sequelize.STRING,
      allowNull: true, // Use the previous settings you had for this column
    });
  }
};


