import { WebContainer } from "@webcontainer/api";
import { useEffect, useState } from "react";

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function main() {
    try {
      // Ensure files are written before install
      if (files.length) {
        await Promise.all(
          files.map(file =>
            webContainer.fs.writeFile(file.path, file.contents)
          )
        );
      }

      const installProcess = await webContainer.spawn("npm", ["install"]);

      const installOutput = await new Promise<string>((resolve, reject) => {
        let output = '';
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              output += data;
            },
            close() {
              resolve(output);
            }
          })
        );
      });

      console.log("Install output:", installOutput);

      const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

      webContainer.on("server-ready", (port, url) => {
        console.log(`Server ready at ${url}`);
        setUrl(url);
      });

    } catch (err) {
      console.error("WebContainer setup error:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    if (webContainer) {
      main();
    }
  }, [webContainer]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url && (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      )}
      {url && <iframe width="100%" height="100%" src={url} />}
    </div>
  );
}
