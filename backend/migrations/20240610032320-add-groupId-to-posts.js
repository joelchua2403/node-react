'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
     // Truncate the Posts table
     await queryInterface.bulkDelete('Posts', null, {});
       // Truncate the Users table
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.addColumn('Posts', 'groupId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Group',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Posts', 'groupId');
  }
};
