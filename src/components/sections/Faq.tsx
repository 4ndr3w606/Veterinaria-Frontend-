import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { faqs } from "@/data/siteData";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-8 max-w-md">
      {faqs.map(([q, a], i) => (
        <div key={q}>
          <Separator />
          <Button variant="ghost" className="h-auto w-full justify-between rounded-none px-0 py-4 text-left text-base font-medium hover:bg-transparent hover:text-primary" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            {q}
            <ChevronDown className={`transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
          </Button>
          <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"}`}>
            <p className="overflow-hidden text-sm leading-7 text-muted-foreground">{a}</p>
          </div>
        </div>
      ))}
      <Separator />
    </div>
  );
}