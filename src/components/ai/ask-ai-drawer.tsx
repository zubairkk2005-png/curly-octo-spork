"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AIChat } from "./ai-chat";

export function AskAiDrawer() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline"><Sparkles className="text-chart-orders" /> <span className="hidden sm:inline">Ask AI</span></Button>
      </DialogTrigger>
      <DialogContent variant="drawer" title="Ask AI" description="Questions are answered from your data for the selected date range." className="sm:max-w-xl">
        <AIChat className="h-full min-h-[70vh] border-0" />
      </DialogContent>
    </Dialog>
  );
}
