const express = require("express");
const trailBalanceRouter = express.Router();
const { getPool } = require('../Database/db')

trailBalanceRouter.get('/get', async (req, res) => {
    try {
        const result = await getPool().request().query('SELECT * FROM T_EGL_HO_INBOUND_TRIAL_BAL_REV');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

trailBalanceRouter.get('/getCtl', async (req, res) => {
    try {
        const result = await getPool().request().query('SELECT * FROM T_EGL_HO_INBOUND_TRIAL_BAL_CTL');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
module.exports = trailBalanceRouter;