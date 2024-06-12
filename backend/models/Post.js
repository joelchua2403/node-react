'use strict';

module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in developement', 'completed'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Group',
        key: 'id',
      },
    },
  });

  Post.associate = function(models) {
    Post.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Post.belongsTo(models.Group, {
      foreignKey: 'groupId',
      as: 'group',
    });
  };

  return Post;
};
