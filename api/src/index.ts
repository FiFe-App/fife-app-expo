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

dotenv.config();

const app = express();
const router = express.Router();
adb.connect();

app.use(cors());
app.use(express.json());

// Load the /posts routes
router.use("/users", checkAuthNoVer, users);

router.use("/", (req, res) => {
  res.send("FiFe Server Running...");
});

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

// registering the router containing all the endpoints
app.use(router);
app.listen(8888);
