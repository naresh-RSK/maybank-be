const express = require("express");
const journalsRouter = express.Router();
const { getPool } = require('../Database/db')

journalsRouter.get('/get', async (req, res) => {
    try {
        const result = await getPool().request().query('SELECT * FROM T_EGL_HO_INBOUND_JOURNALS_REV');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

journalsRouter.get('/getCtl', async (req, res) => {
    try {
        const result = await getPool().request().query('SELECT * FROM T_EGL_HO_INBOUND_JOURNALS_CTL');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = journalsRouter;