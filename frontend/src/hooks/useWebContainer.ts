import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

export function useWebContainer() {
    const [webContainer, setWebContainer] = useState<WebContainer>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function initWebContainer() {
            try {
                setIsLoading(true);
                const webContainerInstance = await WebContainer.boot();
                setWebContainer(webContainerInstance);
            } catch (err) {
                console.error("Failed to initialize WebContainer:", err);
                setError(err instanceof Error ? err.message : "Failed to boot WebContainer");
            } finally {
                setIsLoading(false);
            }
        }

        initWebContainer();
    }, []);

    return {
        webContainer,
        isLoading,
        error
    };
}
