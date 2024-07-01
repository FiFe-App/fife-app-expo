import { getAuth } from 'firebase-admin/auth';

export function checkAuth(req, res, next) {
  if (req.headers.authtoken) {
    getAuth().verifyIdToken(req.headers.authtoken)
      .then((token) => {
        const uid = token.uid;
        req.uid = uid;
        if (token.email_verified)
          next()
        else {
          res.status(403).send('Email not verified.')
        }
      }).catch((err) => {
        console.log(err);
        res.status(403).send('Token expired')
      });
  } else {
    res.status(403).send('Unauthorized')
  }
}
export function checkAuthNoVer(req, res, next) {
  if (req.headers.authtoken) {
    getAuth().verifyIdToken(req.headers.authtoken)
      .then((token) => {
        const uid = token.uid;
        req.uid = uid;
        next()
      }).catch((err) => {
        console.log(err);
        res.status(403).send('Token expired')
      });
  } else {
    res.status(403).send('Unauthorized')
  }
}
export function checkAuthIf(req, res, next) {
  if (req.headers.authtoken) {
    getAuth().verifyIdToken(req.headers.authtoken)
      .then((token) => {
        const uid = token.uid;
        req.uid = uid;
        next()
      }).catch(() => {
        next();
      });
  } else {
    next();
  }
}