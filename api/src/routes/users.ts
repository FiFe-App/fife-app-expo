import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/:uid", async (req: Request, res: Response) => {
  console.log("uid");
  const result = await prisma.user.findFirst({
    where: {
      uid: req.params.uid,
    },
    include: {
      page: {
        include: {
          buziness: true,
        },
      },
    },
  });
  const friendships = await prisma.friendship.findMany({
    where: {
      uid2: req.params.uid,
    },
    select: {
      uid: true,
    },
  });
  if (!result) {
    res.send("Not found").status(404);
    return;
  }
  res.send({ ...result, friendships });
});

export default router;
