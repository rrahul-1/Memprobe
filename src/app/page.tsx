"use client";

import { useRef } from "react";

import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="">
      <NavBar onLoginClick={focusInput}/>
      <div className="h-screen w-5/6 mx-auto px-8 pt-24">
        <Hero inputRef={inputRef}/>
      </div>
    </div>
  );
}
