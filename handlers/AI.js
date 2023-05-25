import { Configuration, OpenAIApi } from "openai";
import "dotenv/config";

export default class AI {
    constructor() {
        this.openai = new OpenAIApi(
            new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            })
        );
    }
    getAIResponse = async (slow, prompt) => {
        try {
            return slow
                ? (
                      await this.openai.createChatCompletion(
                          {
                              model: "gpt-3.5-turbo",
                              messages: [{ role: "user", content: prompt }],
                              temperature: 0.3,
                              max_tokens: 100,
                          },
                          { timeout: 1000 * 60 * 1.5 }
                      )
                  ).data.choices[0].message.content
                : (
                      await this.openai.createCompletion(
                          {
                              model: "text-davinci-003",
                              prompt: prompt,
                              temperature: 0.3,
                              max_tokens: 100,
                          },
                          { timeout: 1000 * 60 * 1.5 }
                      )
                  ).data.choices[0].text.replace("\n\n", "");
        } catch (error) {
            console.log(error.message);
            return "Error occured";
        }
    };
}
