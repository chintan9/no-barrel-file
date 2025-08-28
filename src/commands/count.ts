import { Command } from "commander";
import { Ignorer } from "../lib/ignorer";
import { Parser } from "../lib/parser";

export function configureCountCommand(program: Command) {
  program
    .command("count")
    .description("Count the number of barrel files in the specified project.")
    .action(async () => {
      const options = program.opts();
      const ignorer = await Ignorer.create(
        options.rootPath,
        options.ignorePaths.split(","),
        options.gitignorePath
      );
      const parser = new Parser(
        options.rootPath,
        ignorer,
        options.extensions.split(",")
      );

      const barrelFiles = await parser.findBarrelFiles();
      console.log(barrelFiles.length);
    });
}
