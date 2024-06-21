'use strict';

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    Task_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    Task_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Task_description: {
      type: DataTypes.TEXT,
    },
    Task_notes: {
      type: DataTypes.TEXT,
    },
    Task_app_Acronym: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Application',
        key: 'App_Acronym'
      }
    },
    Task_plan: {
      type: DataTypes.STRING,
    },
    Task_state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'open'
    },
    Task_creator: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Task_owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Task_createDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
  });

  Task.associate = function(models) {
    Task.belongsTo(models.Application, { foreignKey: 'Task_app_Acronym', targetKey: 'App_Acronym' });
  };

  return Task;
};
