import { ProxyAgent, setGlobalDispatcher } from "undici";
import { Scraper } from "agent-twitter-client";
import fs from "fs";
import dotenv from "dotenv";
import pino from "pino";
dotenv.config();

export const logger = pino({
  level: "info",
  transport: {
    targets: [
      {
        level: "info",
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    ],
  },
});

export interface ScraperTestOptions {
  authMethod: "api" | "cookies" | "password" | "anonymous";
}

export async function saveCookies(scraper: Scraper) {
  try {
    logger.info("let me save  loggin cookies...");
    const cookies = await scraper.getCookies();
    fs.writeFileSync("./cookies.json", JSON.stringify(cookies));
    logger.info("Logged in and cookies saved.");
  } catch (error) {
    logger.error("Error during login:", error);
  }
}

export async function getScraper(
  options: Partial<ScraperTestOptions> = { authMethod: "cookies" }
) {
  const username = process.env["TWITTER_USERNAME"];
  const password = process.env["TWITTER_PASSWORD"];
  const email = process.env["TWITTER_EMAIL"];
  const twoFactorSecret = process.env["TWITTER_2FA_SECRET"];

  const apiKey = process.env["TWITTER_API_KEY"];
  const apiSecretKey = process.env["TWITTER_API_SECRET_KEY"];
  const accessToken = process.env["TWITTER_ACCESS_TOKEN"];
  const accessTokenSecret = process.env["TWITTER_ACCESS_TOKEN_SECRET"];

  let cookiesArray: any = null;

  // try to read cookies by reading cookies.json with fs and parsing
  // check if cookies.json exists
  if (!fs.existsSync("./cookies.json")) {
    logger.error(
      "cookies.json not found, using password auth - this is NOT recommended!"
    );
  } else {
    try {
      const cookiesText = fs.readFileSync("./cookies.json", "utf8");
      cookiesArray = JSON.parse(cookiesText);
    } catch (e) {
      console.error("Error parsing cookies.json", e);
    }
  }

  const cookieStrings = cookiesArray?.map(
    (cookie: any) =>
      `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${
        cookie.path
      }; ${cookie.secure ? "Secure" : ""}; ${
        cookie.httpOnly ? "HttpOnly" : ""
      }; SameSite=${cookie.sameSite || "Lax"}`
  );

  const proxyUrl = process.env["PROXY_URL"];
  let agent: any;

  if (
    options.authMethod === "cookies" &&
    (!cookieStrings || cookieStrings.length === 0)
  ) {
    logger.warn(
      "TWITTER_COOKIES variable is not defined, reverting to password auth (not recommended)"
    );
    options.authMethod = "password";
  }

  if (options.authMethod === "password" && !(username && password)) {
    logger.error(
      "TWITTER_USERNAME and TWITTER_PASSWORD variables must be defined."
    );
    throw new Error(
      "TWITTER_USERNAME and TWITTER_PASSWORD variables must be defined."
    );
  }

  if (proxyUrl) {
    // Parse the proxy URL
    const url = new URL(proxyUrl);
    const username = url.username;
    const password = url.password;

    // Strip auth from URL if present
    url.username = "";
    url.password = "";

    const agentOptions: any = {
      uri: url.toString(),
      requestTls: {
        rejectUnauthorized: false,
      },
    };

    // Add Basic auth if credentials exist
    if (username && password) {
      agentOptions.token = `Basic ${Buffer.from(
        `${username}:${password}`
      ).toString("base64")}`;
    }

    agent = new ProxyAgent(agentOptions);

    setGlobalDispatcher(agent);
  }

  const scraper = new Scraper({
    transform: {
      request: (input, init) => {
        if (agent) {
          return [input, { ...init, dispatcher: agent }];
        }
        return [input, init];
      },
    },
  });

  if (
    options.authMethod === "api" &&
    username &&
    password &&
    apiKey &&
    apiSecretKey &&
    accessToken &&
    accessTokenSecret
  ) {
    await scraper.login(
      username,
      password,
      email,
      twoFactorSecret,
      apiKey,
      apiSecretKey,
      accessToken,
      accessTokenSecret
    );
    logger.info("Logged in and cookies save cookies ....");
    // await saveCookies(scraper);
  } else if (options.authMethod === "cookies" && cookieStrings?.length) {
    await scraper.setCookies(cookieStrings);
  } else if (options.authMethod === "password" && username && password) {
    await scraper.login(username, password, email, twoFactorSecret);
  } else {
    console.warn(
      "No valid authentication method available. Ensure at least one of the following is configured: API credentials, cookies, or username/password."
    );
  }

  return scraper;
}
