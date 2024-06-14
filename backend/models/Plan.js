'use strict';

module.exports = (sequelize, DataTypes) => {
  const Plan = sequelize.define('Plan', {
    Plan_MVP_name: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    Plan_startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Plan_endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Plan_app_Acronym: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Application',
        key: 'App_Acronym',
      },
    },
  }, {
    timestamps: false,
  });

  Plan.associate = function(models) {
    Plan.belongsTo(models.Application, {
      foreignKey: 'Plan_app_Acronym',
      targetKey: 'App_Acronym',
    });
    Plan.hasMany(models.Task, {
      foreignKey: 'Task_plan',
      sourceKey: 'Plan_MVP_name',
    });
  };

  return Plan;
};
