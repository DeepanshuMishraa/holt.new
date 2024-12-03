import { WebContainer } from "@webcontainer/api";
import { useEffect, useState } from "react";

interface FileEntry {
  path: string;
  contents: string;
}

interface PreviewFrameProps {
  files: FileEntry[];
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
          for (const file of files) {
            // Use mkdir -p for nested directories
            const dirPath = file.path.split('/').slice(0, -1).join('/');
            if (dirPath) {
              await webContainer.fs.mkdir(dirPath, { recursive: true });
            }

            // Write the file
            await webContainer.fs.writeFile(file.path, file.contents);
          }
        }

        setIsLoading(true);

        // Install dependencies
        const installProcess = await webContainer.spawn("npm", ["install"]);

        // Handle install output
        const installOutput = await new Response(installProcess.output).text();
        console.log("Install output:", installOutput);

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

        // Handle dev process output
        const devOutput = await new Response(devProcess.output).text();
        console.log("Dev server output:", devOutput);

      } catch (err) {
        console.error("Error in WebContainer setup:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
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
