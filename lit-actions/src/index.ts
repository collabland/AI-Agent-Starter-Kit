import { PinataSDK } from "pinata-web3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = new URL(".", import.meta.url).pathname;

const main = async () => {
  const actionsDir = path.join(__dirname, "..", "actions");
  const files = fs.readdirSync(actionsDir).filter((f) => f.endsWith(".js"));
  const results = {};

  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_URL,
  });

  for (const file of files) {
    const filePath = path.join(actionsDir, file);
    console.log("📁 Pinning file to IPFS:", filePath);
    const startTime = Date.now();
    const stream = fs.createReadStream(filePath);
    const result = await pinata.upload.stream(stream).cidVersion(0);
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log("🕒 Duration:", duration / 1000, "seconds");
    console.log("🔗 IPFS CID:", result.IpfsHash);
    const name = file.replace(/.js$/, ""); // invoke actions as name only, without name.js
    results[name] = {
      ...result,
      file,
      Duration: duration / 1000,
    };
  }

  const outputPath = path.join(actionsDir, "ipfs.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log("🔥 Results:", results);
  console.log("✅ Done, output written to:", outputPath);
};

main()
  .then(() => console.log("Done!"))
  .catch(console.error);
