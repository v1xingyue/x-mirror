import { getScraper, logger, saveCookies } from "./utils";
import { db } from "./db";
import { Tweet } from "agent-twitter-client";
import { Command } from "commander";
import ai from "./ai";

const displayTweet = (tweet: Tweet) => {
  logger.info(`\n ===== ${tweet.id} ===== \n`);
  logger.info(tweet.text);
  logger.info(`photos: ${JSON.stringify(tweet.photos)}`);
  logger.info(`videos: ${JSON.stringify(tweet.videos)}`);
  logger.info(`urls: ${JSON.stringify(tweet.urls)}`);
  logger.info(`mentions: ${JSON.stringify(tweet.mentions)}`);
  logger.info(`hashtags: ${JSON.stringify(tweet.hashtags)}`);
  logger.info(`timestamp: ${tweet.timestamp}`);
};

const worker = async () => {
  const scraper = await getScraper();
  await saveCookies(scraper);
  const tweets = scraper.getTweets("ai16zdao", 100);
  for await (const tweet of tweets) {
    displayTweet(tweet);
    if (tweet.text && tweet.id) {
      const is_done = await db.get(tweet.id.toString());
      logger.info(`is_done: ${is_done}`);
      if (!is_done) {
        await scraper.sendTweet(await ai.translate(tweet.text));
        await db.put(tweet.id.toString(), "done");
      } else {
        logger.info(`Already done: ${tweet.id}`);
      }
    }
  }
};

const translate = async () => {
  logger.info("Translating...");
  const msg = await ai.translate("Hello, world!");
  logger.info(msg);
};

const main = async () => {
  const program = new Command();
  program.option("-t, --translate", "Translate the text");
  program.option("-s, --start", "Start the worker");
  program.parse(process.argv);
  const options = program.opts();
  if (options.start) {
    await worker();
  } else if (options.translate) {
    await translate();
  }
};

main();
