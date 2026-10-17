import path from "path"
import { FilePath } from "./path"
import { globby } from "globby"

export function toPosixPath(fp: string): string {
  return fp.split(path.sep).join("/")
}

export async function glob(
  pattern: string,
  cwd: string,
  ignorePatterns: string[],
): Promise<FilePath[]> {
  const fps = (
    await globby(pattern, {
      cwd,
      ignore: ignorePatterns,
      // The UNIVE exporter already selects every input. Generated content is
      // intentionally untracked, but must remain visible to this build.
      gitignore: process.env.UNIVE_GENERATED_CONTENT !== "1",
    })
  ).map(toPosixPath)
  return fps as FilePath[]
}
