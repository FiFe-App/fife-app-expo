import { PrismaClient } from "@prisma/client";
import express from "express";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";
import { checkAuth, checkAuthNoVer } from "../lib/auth.mjs";

const router = express.Router();
const prisma = new PrismaClient();

// New user data
router.post("/", checkAuthNoVer, (req: Request, res: Response) => {
  console.log("create");
  const body : Array<any> = res.body
  const result = await prisma.user.create({
    data: {
      ...body,
      page: {
        create: {
          uid: req.uid,
        },
      },
      uid: req.uid,
      id: undefined,
      pageId: undefined,
      textToType: undefined,
      buziness: undefined,
      interest: undefined,
    },
  });

  console.log("res", result);
  const result2 = await Promise.all(
    req.body.buziness.map(async (buzi, ind) => {
      if (buzi && buzi.name && buzi.description)
        return await prisma.buziness.create({
          data: {
            num: ind,
            uid: req.uid,
            ...buzi,
            removed: undefined,
            page: {
              connect: {
                id: result.pageId,
              },
            },
          },
        });
    })
  );
  console.log(result2);
  if (!result) res.send("could not create").status(404);
  res.send(result.id);
});

router.get("/all/:uid", async (req, res) => {
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
  const friendship = await prisma.friendship.findMany({
    where: {
      uid2: req.params.uid,
    },
    select: {
      uid: true,
    },
  });
  console.log(result);
  if (!result) {
    res.send("Not found").status(404);
    return;
  }
  //  res.send(result)
  res.send({ ...result, friendship });
  return "hello";
});

router.post("/search", async (req, res) => {
  const { search } = req.body;
  // query for movies that have a runtime less than 15 minutes
  if (search.length < 3) {
    res.send({ error: "Adj meg legalább három karaktert!" });
    return;
  }
  console.log(req.body);

  const results = await prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              username: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        {
          NOT: { uid: req.uid },
        },
      ],
    },
  });

  //res.send('latestqd')
  console.log(results);
  res.send(results).status(202);
});

router.get("/mybuziness", checkAuth, async (req, res) => {
  console.log(req.uid);
  const result = await prisma.buziness.findMany({
    where: {
      uid: req.uid,
    },
  });
  //console.log(result);
  if (!result) {
    res.send("Not found").status(404);
    return;
  }
  res.send(result);
  return "hello";
});
router.patch("/", checkAuthNoVer, async (req, res) => {
  if (req.body.page.buziness?.length > 5) {
    res.send({ error: "Maximum 5 biniszed lehet!" });
    return;
  }

  const location = req.body.page?.location;

  const result = await prisma.user.upsert({
    where: {
      uid: req.uid,
    },
    update: {
      ...req.body.data,
      id: undefined,
      placeId: undefined,
      page: {
        upsert: {
          create: {
            uid: req.uid,
            location: location?.length == 2 ? location : undefined,
          },
          update: {
            uid: req.uid,
            location: location?.length == 2 ? location : undefined,
          },
        },
      },
      pageId: undefined,
      buziness: undefined,
    },
    create: {
      ...req.body.data,
      page: {
        connectOrCreate: {
          create: {
            uid: req.uid,
            location: location?.length == 2 ? location : undefined,
          },
          where: {
            uid: req.uid,
          },
        },
      },
      uid: req.uid,
      id: undefined,
      pageId: undefined,
      placeId: undefined,
      buziness: undefined,
    },
    include: {
      page: {
        include: {
          buziness: true,
        },
      },
    },
  });

  const f = await getDatabase()
    .ref("users/" + req.uid + "/data/name")
    .set(req.body.data.name);
  console.log("f", f);
  console.log(req.body.page);

  const newB = req.body.page.buziness;
  const diff = newB.filter((x) => x?.removed == true);

  /*  console.log(newB);
  console.log(oldB);
  console.log('diff',diff);
  return*/

  const result2 = await Promise.all(
    newB.map(async (buzi, ind) => {
      if (buzi && buzi.name && buzi.description)
        return await prisma.buziness.upsert({
          where: {
            id: result.page.buziness[ind]?.id || "000000000000000000000000",
          },
          create: {
            num: ind,
            uid: req.uid,
            ...buzi,
            removed: undefined,
            page: {
              connect: {
                id: result.pageId,
              },
            },
          },
          update: {
            num: ind,
            uid: req.uid,
            ...buzi,
            removed: undefined,
            id: undefined,
          },
        });
    })
  );
  if (diff.length) {
    const deleteOld = await Promise.all(
      diff.map(async (buzi, ind) => {
        if (buzi)
          return await prisma.buziness.delete({
            where: {
              id: buzi.id,
            },
          });
      })
    );
    console.log("deleteOld", deleteOld);
  }
  if (!result) {
    res.send("Not found").status(404);
    return;
  }
  res.send(result);
  return "hello";
});

router.post("/friend/:uid", checkAuth, async (req, res) => {
  const result = await prisma.friendship.create({
    data: {
      uid: req.uid,
      uid2: req.params.uid,
    },
  });

  if (!result) {
    res.send("Not found").status(404);
    return;
  }

  const db = getDatabase();
  const ref = db.ref("users/" + req.params.uid + "/data/fcm/token");
  const name = db.ref("users/" + req.uid + "/data/name");
  ref.once("value", function (snapshot) {
    name.once("value", function (nameSnapshot) {
      const token = snapshot.val();
      const name = nameSnapshot.val();
      const payload = {
        token: token,
        notification: {
          title: name + " pajtásnak jelölt téged!",
          body: "Juhú!",
          image: "https://i.ibb.co/KxgW84L/logo.png",
        },
        webpush: {
          fcmOptions: {
            link: "https://fifeapp.hu/profil?uid=" + req.uid,
          },
        },
      };
      getMessaging()
        .send(payload)
        .then((res) => {
          console.log("siker", res, payload);
        })
        .catch((err) => {
          console.log("vmi mem jo", err);
        });
    });
  });
  res.send(result);
  return "hello";
});
router.delete("/friend/:uid", checkAuth, async (req, res) => {
  const result = await prisma.friendship.deleteMany({
    where: {
      OR: [
        {
          uid: req.params.uid,
          uid2: req.uid,
        },
        {
          uid: req.uid,
          uid2: req.params.uid,
        },
      ],
    },
  });

  if (!result) {
    res.send("Not found").status(404);
    return;
  }
  res.send(result);
  return "hello";
});
router.patch("/friend/:uid", checkAuth, async (req, res) => {
  const result = await prisma.friendship.updateMany({
    where: {
      uid: req.params.uid,
      uid2: req.uid,
    },
    data: {
      allowed: true,
    },
  });

  if (!result) {
    res.send("Not found").status(404);
    return;
  }
  res.send(result);
  return "hello";
});

export default router;
