import { Router } from "express"


const router = Router();

router.get("/getall", (req, res) => {
    return res.status(200).json({ users: ["user1", "user2", "user3"] });
});

export default router;