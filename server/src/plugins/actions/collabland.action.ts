import { AnyType, getCollablandApiUrl } from "../../utils.js";
import { Action, ActionExample, Validator, Handler } from "@ai16z/eliza";
import axios, { AxiosInstance } from "axios";

export abstract class CollabLandBaseAction implements Action {
  protected client: AxiosInstance;

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly similes: string[],
    public readonly examples: ActionExample[][],
    public readonly handler: Handler,
    public readonly validate: Validator
  ) {
    this.name = name;
    this.description = description;
    this.similes = similes;
    this.examples = examples;
    this.handler = handler;
    this.validate = validate;

    this.client = axios.create({
      baseURL: getCollablandApiUrl(),
      headers: {
        "X-API-KEY": process.env.COLLABLAND_API_KEY || "",
        "X-TG-BOT-TOKEN": process.env.TELEGRAM_BOT_TOKEN || "",
        "Content-Type": "application/json",
      },
      timeout: 5 * 60 * 1000,
    });
  }

  protected handleError(error: AnyType): void {
    console.log(error);
    if (axios.isAxiosError(error)) {
      console.dir(error.response?.data, { depth: null });
      throw new Error(
        `CollabLand API error: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}
