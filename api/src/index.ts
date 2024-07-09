import cors from "cors";
import dotenv from "dotenv";
import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import users from "./routes/users";
import adb from "../db/conn";

dotenv.config();

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// Load the /posts routes
router.use("/users", users);

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
