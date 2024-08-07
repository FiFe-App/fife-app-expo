import { PrismaClient } from "@prisma/client";
import express, { Request } from "express";
import adb from "../../db/conn";

const router = express.Router();
const prisma = new PrismaClient();

const getBuziness = async (
  key = "",
  myLocation: number[],
  skip: number,
  take: number,
) => {
  const db = await adb.db();
  const buziness = db.collection("buziness");
  console.log("limit", take, skip);
  console.log(myLocation);

  const results = await buziness
    .aggregate([
      {
        $lookup: {
          from: "page",
          let: {
            pageId: "$pageId",
            name: "$name",
          },
          pipeline: [
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [21, 12],
                },
                distanceMultiplier: 0.001,
                distanceField: "distance",
                spherical: true,
              },
            },
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$pageId"],
                },
              },
            },
            { $project: { distance: 1 } },
          ],
          as: "page",
        },
      },
      {
        $sort: {
          "page.0.distance": -1,
        },
      },
      {
        $limit: Number(take) + Number(skip),
      },
      {
        $skip: Number(skip),
      },
      {
        $match: {
          name: {
            $regex: key,
          },
        },
      },
      {
        $lookup: {
          from: "buzinessInterest",
          localField: "buzinessInterest",
          foreignField: "buziness",
          as: "interest",
        },
      },
      { $addFields: { interestCount: { $size: "$interest" } } },
    ])
    .toArray();

  return results;
};

type ReqDictionary = {};
type ReqBody = { foo1?: string };
type ReqQuery = {
  search?: string;
  take?: number;
  skip?: number;
  location?: number[];
};
type ResBody = any;

type SomeHandlerRequest = Request<ReqDictionary, ResBody, ReqBody, ReqQuery>;

router.get("/", async (req: SomeHandlerRequest, res) => {
  const { search, take = 10, skip = 0 } = req.query;

  let results;
  console.log(req.query.location);

  if (req?.query?.location) {
    const myLocation = req?.query?.location.splice(0, 2);
    results = await getBuziness(
      String(search),
      myLocation,
      Number(skip),
      Number(take),
    );
    console.log(results);
  } else {
    results = await prisma.buziness.findMany({
      where: {
        name: {
          contains: String(search),
          mode: "insensitive",
        },
      },
      take: Number(take),
      skip: Number(skip),
    });
  }
  res.send(results).status(202);
});

export default router;
