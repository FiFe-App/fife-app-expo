import cors from "cors";
import dotenv from "dotenv";
import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import adb from "../db/conn";
import { checkAuthNoVer } from "../lib/auth";
import users from "./routes/users";
import serverless from "serverless-http";
import buziness from "./routes/buziness";

dotenv.config();

const app = express();
const router = express.Router();

adb.connect();

app.use(cors());
app.use(express.json());

router.use("/users", checkAuthNoVer, users);
router.use("/buziness", checkAuthNoVer, buziness);
app.use("/.netlify/functions/index", router);

// Global error handling
router.use(
  (
    err: ErrorRequestHandler,
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    console.log(err);
    res.status(500).send("Uh oh! An unexpected error occured.");
  },
);
app.listen(8888);
export const handler = serverless(app);
