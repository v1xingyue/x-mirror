import { getScraper, logger, saveCookies } from "./utils";
import { db } from "./db";

const main = async () => {
  const scraper = await getScraper();
  await saveCookies(scraper);
  const tweets = scraper.getTweets("ai16zdao", 20);
  for await (const tweet of tweets) {
    logger.info(`\n ===== ${tweet.id} ===== \n`);
    logger.info(tweet.text);
    logger.info(`photos: ${JSON.stringify(tweet.photos)}`);
    logger.info(`videos: ${JSON.stringify(tweet.videos)}`);
    logger.info(`urls: ${JSON.stringify(tweet.urls)}`);
    logger.info(`mentions: ${JSON.stringify(tweet.mentions)}`);
    logger.info(`hashtags: ${JSON.stringify(tweet.hashtags)}`);
    logger.info(`timestamp: ${tweet.timestamp}`);

    if (tweet.text && tweet.id) {
      const is_done = await db.get(tweet.id.toString());
      logger.info(`is_done: ${is_done}`);
      if (!is_done) {
        await scraper.sendTweet(tweet.text);
        await db.put(tweet.id.toString(), "done");
      } else {
        logger.info(`Already done: ${tweet.id}`);
      }
    }
  }
};

main();
