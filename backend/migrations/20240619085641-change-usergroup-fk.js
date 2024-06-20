'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addConstraint('UserGroups', {
      fields: ['groupId'],
      type: 'foreign key',
      name: 'fk_usergroups_groupId',
      references: {
        table: 'Groups',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

 
};
