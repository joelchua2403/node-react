'use strict';

module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });

  Group.associate = function(models) {
    Group.belongsToMany(models.User, { through: 'UserGroup', foreignKey: 'groupId', as: 'users' });
    Group.hasMany(models.Post, { foreignKey: 'groupId', as: 'posts' });
  };

  return Group;
};
