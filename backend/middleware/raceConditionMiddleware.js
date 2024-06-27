const { sequelize } = require('../models');

const transactionLockMiddleware = (modelName, idField = 'id') => async (req, res, next) => {
    const id = req.params[idField];
  if (!id) {
    return res.status(400).json({ message: `Missing required parameter: ${idField}` });
  }


  const transaction = await sequelize.transaction();

  try {
    const Model = require('../models')[modelName];

    // Lock the row for update to prevent race conditions
    const record = await Model.findOne({
      where: { 'Task_id': id },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!record) {
      await transaction.rollback();
      return res.status(404).json({ message: `${modelName} not found` });
    }

    req.record = record;
    req.transaction = transaction;
    next();
  } catch (error) {
    await transaction.rollback();
    console.error(`Error in transaction lock middleware for ${modelName}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const commitTransaction = async (req, res, next) => {
  try {
    await req.transaction.commit();
    next();
  } catch (error) {
    console.error('Error committing transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const rollbackTransaction = async (req, res) => {
  try {
    await req.transaction.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } catch (error) {
    console.error('Error rolling back transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  transactionLockMiddleware,
  commitTransaction,
  rollbackTransaction,
};
