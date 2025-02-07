import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import axios, { AxiosHeaders } from "axios";
import { logger } from "./utils";

const translate = async (text: string) => {
  const ai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    fetch: async (input: URL | RequestInfo, init?: RequestInit | undefined) => {
      const url = input.toString();
      if (init?.method === "POST" && init?.body) {
        logger.info(`do proxy request\n ${url} \n ${init.body}`);

        const headers = new AxiosHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("Authorization", `Bearer ${process.env.OPENAI_API_KEY}`);
        const response = await axios.post(url, init.body, { headers });

        // Mimic the fetch Response object
        return new Response(JSON.stringify(response.data), {
          status: response.status,
          statusText: response.statusText,
        });
      }
      return fetch(input, init);
    },
  });

  const { text: translatedText } = await generateText({
    model: ai("gpt-4o"),
    system: "You are a friendly assistant!",
    prompt: `Translate the following text to Chinese: ${text}`,
  });

  console.log(translatedText);
  return translatedText;
};

export default { translate };
