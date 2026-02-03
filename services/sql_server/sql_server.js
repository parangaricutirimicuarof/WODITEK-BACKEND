import { Router } from "express";
import { getConnection } from "../sqlconfig.js";
const router = Router();
router.post("/query", async (req, res) => {
    const { query } = req.body;
    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .query(query);
        res.json({ status: "success", data: result.recordset });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
export default router;