import dotenv from 'dotenv';
import {VideoCacheHelper} from "./video-cache-helper";
import {startTelegramBot} from "./telegram/telegram-bot";

dotenv.config();

VideoCacheHelper.init(process.env.CACHE_FILE_PATH || 'cache.txt');

startTelegramBot();