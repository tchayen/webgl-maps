import express from 'express';
import cors from 'cors';
import { fetchData } from './trams';

const app = express();
const port = 4000;

process.on('SIGINT', () => console.log('SIGINT received'));

const whitelist = ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (origin !== undefined && whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    },
    optionsSuccessStatus: 200,
  }),
);

app.get('/api', async (_req, res) => {
  const data = await fetchData();
  res.json({ data });
});

app.listen(port, () => console.log(`Listening on ${port}`));
