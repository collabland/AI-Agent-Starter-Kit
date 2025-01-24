import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";

const db = new OrbisDB({
  ceramic: {
    gateway: "https://ceramic-orbisdb-mainnet-direct.hirenodes.io/",
  },
  nodes: [
    {
      gateway: "https://studio.useorbis.com",
      env: process.env.ORBIS_ENV,
    },
  ],
});

const embeddingModel = {
  name: "EmbeddingModel",
  schema: {
    type: "object",
    properties: {
      embedding: {
        type: "array",
        items: {
          type: "number",
        },
        examples: [
          {
            "x-orbisdb": {
              postgres: {
                type: "vector(1536)",
                index: {
                  method: "ivfflat",
                  storage: "(lists = 100)",
                  predicate: "embedding IS NOT NULL",
                },
                extensions: ["vector"],
              },
            },
          },
        ],
      },
      content: {
        type: "string",
      },
      is_user: {
        type: "boolean",
      },
    },
    additionalProperties: false,
  },
  version: "2.0",
  interface: false,
  implements: [],
  description: "Embedding Test model",
  accountRelation: {
    type: "list",
  },
};

const run = async () => {
  const seed = await OrbisKeyDidAuth.generateSeed();

  // Initiate the authenticator using the generated (or persisted) seed
  const auth = await OrbisKeyDidAuth.fromSeed(seed);

  // Authenticate the user
  await db.connectUser({ auth });
  const model = await db.ceramic.createModel(embeddingModel);
  console.log({
    model,
  });
};
run();
