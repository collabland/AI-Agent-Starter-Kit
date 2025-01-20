import { OrbisKeyDidAuth } from "@useorbis/db-sdk/auth";

const run = async () => {
  const seed = OrbisKeyDidAuth.generateSeed();
  console.log({
    seed,
  });
};
run();
