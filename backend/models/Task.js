'use strict';

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    Task_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Task_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Task_description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    Task_notes: {
      type: DataTypes.TEXT,
    },
    Task_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Task_app_Acronym: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Application',
        key: 'App_Acronym',
      },
    },
    Task_plan: {
      type: DataTypes.STRING,
      references: {
        model: 'Plan',
        key: 'Plan_MVP_name',
      },
    },
    Task_state: {
      type: DataTypes.STRING,
      allowNull: false,
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
    },
  }, {
    timestamps: false,
  });

  Task.associate = function(models) {
    Task.belongsTo(models.Application, {
      foreignKey: 'Task_app_Acronym',
      targetKey: 'App_Acronym',
    });
    Task.belongsTo(models.Plan, {
      foreignKey: 'Task_plan',
      targetKey: 'Plan_MVP_name',
    });
  };

  return Task;
};
