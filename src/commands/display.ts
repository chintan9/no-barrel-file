import { Command } from "commander";
import path from "path";
import { Ignorer } from "../lib/ignorer";
import { Parser } from "../lib/parser";

export function configureDisplayCommand(program: Command) {
  program
    .command("display")
    .description("Display all barrel files found in the specified project.")
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
      console.log(`${barrelFiles.length} barrel files found`);
      for (const file of barrelFiles) {
        console.log(path.relative(options.rootPath, file));
      }
    });
}
