'use strict';

module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    App_Acronym: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      validate: {
        is: /^[a-zA-Z0-9_]+$/ // Only alphanumeric and underscore
      }
    },
    App_Description: {
      type: DataTypes.TEXT,
      allowNull: true, // Optional field
    },
    App_Rnumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1 // Must be positive integer and non-zero
      }
    },
    App_startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    App_endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    App_permit_Create: {
      type: DataTypes.STRING,
      allowNull: true, // Optional field
      references: {
        model: 'Group',
        key: 'name'
      }
    },
    App_permit_Open: {
      type: DataTypes.STRING,
      allowNull: true, // Optional field
      references: {
        model: 'Group',
        key: 'name'
      }
    },
    App_permit_toDoList: {
      type: DataTypes.STRING,
      allowNull: true, // Optional field
      references: {
        model: 'Group',
        key: 'name'
      }
    },
    App_permit_Doing: {
      type: DataTypes.STRING,
      allowNull: true, // Optional field
      references: {
        model: 'Group',
        key: 'name'
      }
    },
    App_permit_Done: {
      type: DataTypes.STRING,
      allowNull: true, // Optional field
      references: {
        model: 'Group',
        key: 'name'
      }
    },
  }, {
    timestamps: false,
  });

  Application.associate = function(models) {
    Application.hasMany(models.Plan, {
      foreignKey: 'Plan_app_Acronym',
      sourceKey: 'App_Acronym',
    });
    Application.hasMany(models.Task, {
      foreignKey: 'Task_app_Acronym',
      sourceKey: 'App_Acronym',
    });
  };

  return Application;
};
