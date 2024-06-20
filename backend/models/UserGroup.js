'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserGroup = sequelize.define('UserGroup', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'User',
        key: 'username'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Group',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  });

  UserGroup.associate = function(models) {
    UserGroup.belongsTo(models.User, { foreignKey: 'username', as: 'user' });
    UserGroup.belongsTo(models.Group, { foreignKey: 'groupId', as: 'group' });
  };

  return UserGroup;
};
