import { NextFunction, Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";

export function checkAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  console.log(req.headers);

  const token = req.headers.authorization;

  if (token) {
    getAuth()
      .verifyIdToken(token)
      .then((token) => {
        const uid = token.uid;
        req.uid = uid;
        if (token.email_verified) next();
        else {
          res.status(403).send("Email not verified.");
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(403).send("Token expired");
      });
  } else {
    res.status(403).send("Unauthorized");
  }
}
export function checkAuthNoVer(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.headers.authorization) {
    const token: string = req.headers.authorization;
    getAuth()
      .verifyIdToken(token)
      .then((token) => {
        const uid = token.uid;
        req.uid = uid;
        next();
      })
      .catch((err) => {
        console.log(err);
        res.status(403).send("Token expired");
      });
  } else {
    res.status(403).send("Unauthorized");
  }
}
export function checkAuthIf(req: Request, res: Response, next: NextFunction) {
  if (req.headers.authorization) {
    getAuth()
      .verifyIdToken(req.headers.authorization)
      .then((token) => {
        const uid = token.uid;
        req.uid = uid;
        next();
      })
      .catch(() => {
        next();
      });
  } else {
    next();
  }
}
