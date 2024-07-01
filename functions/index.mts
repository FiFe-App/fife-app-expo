import express from 'express';
import cors from 'cors';
import './lib/loadEnvironment.mjs';
import 'express-async-errors';
import admin from './routes/admin.mjs';
import all from './routes/all.mjs';
import sale from './routes/sale.mjs';
import buziness from './routes/buziness.mjs';
import users from './routes/users.mts';
import search from './routes/search.mjs';
import places from './routes/places.mjs';
import docs from './routes/docs.mjs';
import blog from './routes/blog.mjs';
import trade from './routes/trade.mjs';
import { checkAuth } from './lib/auth.mjs';
import serverless from 'serverless-http';

const app = express();
const router = express.Router()

app.use(cors());
app.use(express.json());

router.use('/admin',  checkAuth,      admin);
router.use('/all',                    all);
router.use('/sale',                   sale);
router.use('/buziness',               buziness);
router.use('/docs',                   docs);
router.use('/blog',                   blog);
router.use('/users',                  users);
router.use('/places',                 places);
router.use('/search', checkAuth,      search);
router.use('/trade',  checkAuth,      trade);

// Global error handling
router.use((err, _req, res, next) => {
  res.status(500).send('Uh oh! An unexpected error occured.')
})

app.use('/.netlify/functions/index',router)


export const handler = serverless(app)