import * as React from "react";
import { Database, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCRMStore } from "@/lib/crm-store";
import { cn } from "@/lib/utils";

export function DataConnector() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [jsonInput, setJsonInput] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    const setDataContext = useCRMStore((state) => state.setDataContext);
    const dataContext = useCRMStore((state) => state.dataContext);

    // Pre-fill with existing data if available
    React.useEffect(() => {
        if (isOpen && Object.keys(dataContext).length > 0) {
            setJsonInput(JSON.stringify(dataContext, null, 2));
        }
    }, [isOpen, dataContext]);

    const handleImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setDataContext(parsed);
            setSuccess(true);
            setError(null);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
            }, 1000);
        } catch (e) {
            setError("Invalid JSON format. Please check your syntax.");
            setSuccess(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="fixed bottom-4 right-20 z-50 rounded-full h-10 w-10 shadow-lg bg-background border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                    <Database className="h-5 w-5 text-zinc-500" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Connect Data (Holocron)</DialogTitle>
                    <DialogDescription>
                        Paste your CRM data here as JSON. The AI will use this data to generate insights and widgets.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder='{ "revenueHistory": [...] }'
                        className={cn(
                            "h-[300px] font-mono text-xs",
                            error ? "border-red-500 focus-visible:ring-red-500" : ""
                        )}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    {success && (
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Data connected successfully
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleImport} disabled={success}>
                        {success ? "Connected" : "Import Data"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
