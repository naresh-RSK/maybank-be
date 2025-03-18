const express = require("express");
const reverseMappingRouter = express.Router();
const { getPool } = require('../Database/db')

reverseMappingRouter.get('/get', async (req, res) => {
    try {
        const result = await getPool().request().query('SELECT * FROM T_EGL_HO_REV_MAP_JOB_CONFIG');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


module.exports = reverseMappingRouter;