import { getScraper, logger, saveCookies } from "./utils";

const main = async () => {
  const scraper = await getScraper();
  await saveCookies(scraper);
  const tweets = scraper.getTweets("shawmakesmagic", 20);
  for await (const tweet of tweets) {
    logger.info(tweet.text, tweet.id);
  }
  // scraper.sendTweet("Hello, world!");
};

main();
