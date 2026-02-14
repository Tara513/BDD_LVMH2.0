"use client";

import { useRouter } from "next/navigation";

export function BackToFichesLink() {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/dashboard/seller");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-neutral-400 transition hover:text-white"
    >
      ← Fiches clients
    </button>
  );
}
