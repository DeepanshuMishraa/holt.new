import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer>();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function main() {
            try {
                const webcontainerInstance = await WebContainer.boot();
                setWebcontainer(webcontainerInstance);
            } catch (err) {
                console.error("WebContainer boot error:", err);
                setError(err instanceof Error ? err.message : String(err));
            }
        }

        main();
    }, []);

    return { webcontainer, error };
}
