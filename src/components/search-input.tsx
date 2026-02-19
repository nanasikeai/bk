"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchInput() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <Input
        type="search"
        placeholder="搜索文章..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full sm:w-64"
      />
      <Button type="submit" size="icon" variant="ghost">
        <Search className="h-4 w-4" />
        <span className="sr-only">搜索</span>
      </Button>
    </form>
  );
}
