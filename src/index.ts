import { Command } from "commander";
import { mirror_twitter, translate } from "./workers";

const main = async () => {
  const program = new Command();
  program.option("-t, --translate", "Translate the text");
  program.option("-s, --start", "Start the worker");
  program.parse(process.argv);
  const options = program.opts();
  if (options.start) {
    await mirror_twitter();
  } else if (options.translate) {
    await translate();
  }
};

main();
