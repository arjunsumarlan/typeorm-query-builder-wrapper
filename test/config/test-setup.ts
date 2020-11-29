import { Connection, createConnection } from 'typeorm';
import * as path from 'path';

require('dotenv').config();
jest.setTimeout(5 * 60 * 1000);

const connection: Connection = null;

beforeAll(async () => {
  await createConnection({
    type: 'postgres',
    host: process.env.HOST,
    port: 5432,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DB,
    schema: 'public',
    entities: [path.join(__dirname, '../', '**/*.entity{.ts,.js}')],
    migrationsRun: false,
    logging: true,
    logger: 'advanced-console',
    maxQueryExecutionTime: 1000,
    synchronize: false,
    cache: {
      type: 'redis',
      duration: 10000,
      options: {
        host: process.env.REDIS_HOST,
        port: 6379,
        password: process.env.REDIS_PASSWORD,
      },
    },
  });
});

afterAll(async () => {
  if (connection) {
    await connection.close();
  }
});
