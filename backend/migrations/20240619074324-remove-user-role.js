'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    
      await queryInterface.removeColumn('Users', 'role');
   

 
  },

  down: async (queryInterface, Sequelize) => {
  

    // Add the 'role' column back to 'Users' table
    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      allowNull: false,
    });

   
  }
};
