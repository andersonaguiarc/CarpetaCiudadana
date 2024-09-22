import dotenv from 'dotenv';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

dotenv.config();

export const connectionOptions: MysqlConnectionOptions = {
  database: process.env.MYSQL_DATABASE,
  entities: [
    "src/entity/*.ts"
  ],
  host: process.env.MYSQL_HOST,
  logging: false,
  password: process.env.MYSQL_PASSWORD,
  port: Number(process.env.MYSQL_PORT),
  synchronize: true,
  type: "mysql",
  username: process.env.MYSQL_USERNAME
};