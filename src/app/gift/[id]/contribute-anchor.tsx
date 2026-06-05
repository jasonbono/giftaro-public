"use client";

import { buttonClasses } from "@/components/ui";

export function ContributeAnchor() {
  return (
    <a
      href="#contribute"
      onClick={(e) => {
        const el = document.getElementById("contribute");
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
      className={buttonClasses("primary", "pill", "lg")}
    >
      Chip in
    </a>
  );
}
