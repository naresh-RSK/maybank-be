const express = require("express");
const baseSystemRouter = express.Router();
const { getPool } = require('../Database/db')

baseSystemRouter.get('/get', async (req, res) => {
    try {
        const result = await getPool().request().query('SELECT * FROM T_EGL_BASE_SYSTEMS');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


module.exports = baseSystemRouter;