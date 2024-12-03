import { WebContainer } from "@webcontainer/api";
import { useEffect, useState } from "react";

interface PreviewFrameProps {
  files: any[];
  webContainer?: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function main() {
      try {
        // Check if webContainer is defined
        if (!webContainer) {
          setError("WebContainer not initialized");
          setIsLoading(false);
          return;
        }

        // Ensure files are added before installation
        if (files && files.length > 0) {
          await Promise.all(
            files.map(async (file) => {
              await webContainer.fs.writeFile(file.path, file.contents);
            })
          );
        }

        setIsLoading(true);

        // Install dependencies
        const installProcess = await webContainer.spawn("npm", ["install"]);

        // Optional: Handle install output
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log(data);
            },
          })
        );

        // Wait for install to complete
        await installProcess.exit;

        // Start dev server
        const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

        // Setup server-ready listener
        webContainer.on("server-ready", (port, serverUrl) => {
          console.log(`Server ready on port ${port}`);
          console.log(`Server URL: ${serverUrl}`);
          setUrl(serverUrl);
          setIsLoading(false);
        });

        // Optional: Handle dev process output
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log(data);
            },
          })
        );
      } catch (err) {
        console.error("Error in WebContainer setup:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setIsLoading(false);
      }
    }

    main();
  }, [webContainer, files]);

  // Render logic with improved error handling
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {isLoading && (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      )}

      {error && (
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      )}

      {url && (
        <iframe
          width="100%"
          height="100%"
          src={url}
          title="WebContainer Preview"
        />
      )}
    </div>
  );
}

