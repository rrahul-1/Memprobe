"use client";

import { useRef } from "react";
import LandingNavBar from "@/components/LandingNavBar";
import Hero from "@/components/Hero";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <LandingNavBar onLoginClick={focusInput}/>
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-24">
        <Hero inputRef={inputRef}/>
      </div>
    </div>
  );
}
