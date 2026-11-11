import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import {
  verifyBackup,
  restoreBackup,
  unlockWorkspace,
} from "../src/recovery.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.env.FUNDTRACE_DATA_DIR || join(root, "data");
const cli = createInterface({ input: process.stdin, output: process.stdout });
try {
  const command = process.argv[2] || "restore";
  if (command === "unlock") {
    unlockWorkspace(target);
    console.log("Stale lock removed. You can start FundTrace.");
  } else {
    if (!["restore", "verify"].includes(command))
      throw new Error("Use restore, verify or unlock.");
    if (command === "restore" && process.env.FUNDTRACE_KEY)
      throw new Error(
        "Unset FUNDTRACE_KEY before restoring; the backup includes the correct key.",
      );
    const source = (
      process.argv[3] || (await cli.question("Backup folder path: "))
    )
      .trim()
      .replace(/^"(.*)"$/, "$1");
    const manifest = verifyBackup(source);
    console.log(
      `Verified backup: ${manifest.createdAt}\nDestination: ${resolve(target)}`,
    );
    if (command === "restore") {
      console.log(
        "Close FundTrace first. This replaces the active workspace with this snapshot. The previous data folder will be retained beside it.",
      );
      if ((await cli.question("Type RESTORE to continue: ")) !== "RESTORE")
        throw new Error("Restore cancelled. No data changed.");
      console.log(JSON.stringify(restoreBackup(source, target), null, 2));
      console.log(
        "Restore complete. Start FundTrace and check balances and recent records.",
      );
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  cli.close();
}
