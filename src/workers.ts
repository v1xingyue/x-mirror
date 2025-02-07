import ai from "./ai";
import { db } from "./db";
import { displayTweet, getScraper, logger, saveCookies } from "./utils";

export const translate = async () => {
  logger.info("Translating...");
  const msg = await ai.translate("Hello, world!");
  logger.info(msg);
};

export const mirror_twitter = async () => {
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
