"use client";

import { RefObject, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage"

type HeroProps = {
  inputRef: RefObject<HTMLInputElement | null>;
};



const Hero = ({ inputRef, }: HeroProps) => {
  const router = useRouter();
  const [mem0ApiKey, setMem0ApiKey] = useState("");
  const isDisabled = mem0ApiKey.trim() === "";

  const validateApikey = async (): Promise<boolean> => {
    const response = await fetch("/api/validate", {
      headers: {
        "mem0-apiKey": mem0ApiKey!,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      console.log("Invalid Apikey.", data);
      return false;
    }
    return true;
  };

  const saveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const isLegit = await validateApikey();
    if (isLegit) {
      storage.setApiKey(mem0ApiKey);
      console.log("Moving to the dashboard");
      router.push("/dashboard");
    } else {

    }
  }

  return (
    <section className="">
      <div className='flex items-center gap-2 h-6.5 w-30.5 px-2.5 border border-[#232329] rounded-full text-[#9896A4] bg-[#111113] text-[12px]'>
        <span className='bg-[#1DD5A3] w-1.5 h-1.5 rounded-full'></span>
        <span className='font-medium'>v0.1 VERSION</span>
      </div>
      <h1 className='text-[#EDECF0] text-6xl mt-7 font-medium'>
        See what your
        <br />
        AI agents actually remember.
      </h1>
      <p className='mt-6 text-[#9896A4]'>
        The developer layer on top of Mem0 - inspect, debug, and understand your agent's memory in real time.
      </p>
      <form className='max-w-150 mt-9'
        onSubmit={saveApiKey}
      >
        <div className='flex gap-2 items-stretch p-1.5 bg-[#111113] rounded-2xl border border-[#2E2E38] font-["Geist_Mono",ui-monospace,"JetBrains_Mono","SFMono-Regular",monospace]'>
          <div className='text-[#5C5A6A] flex gap-2 items-center h-12 pl-2.5'>
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none'
              stroke="currentColor" strokeWidth='1.5' strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0 }}>
              <>
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </>
            </svg>
            <span className='text-[13px]'>
              MEM0_API_KEY
            </span>
          </div>
          <input className='px-2 bg-transparent text-[#EDECF0] text-[14px] tracking-[1px] flex grow outline-none focus:outline-0 border-0 focus:ring-0 focus-within:border-[#5a51ad] focus-within:shadow-[0_0_24px_rgba(124,110,248,0.40)] focus-within:bg-[#141418] focus-within:rounded-2xl'
            placeholder='m0-•••• •••• •••• ••••'
            ref={inputRef}
            onChange={(e) => setMem0ApiKey(e.target.value)}
            value={mem0ApiKey}
          ></input>
          <button
            className={`flex gap-1.5 items-center 
             rounded-lg 
            font-medium px-2 m-1
             duration-150
             
            ${isDisabled
                ? "bg-[#2A2A32] text-[#6B6B76] cursor-not-allowed"
                : "bg-[#7C6EF8] text-white hover:bg-[#9182FA]"

              }`}
            disabled={isDisabled}
          >
            Connect
            <span>
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none'
                stroke="currentColor" strokeWidth='1.5' strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0 }}>
                <><path d="M5 12h14" /><path d="m13 5 7 7-7 7" /></>
              </svg>

            </span>
          </button>
        </div>
        <div className="text-[#5C5A6A] mt-3.5 flex gap-4.5 text-[12px] px-6">
          <span className="flex items-center gap-2">
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none'
              stroke="currentColor" strokeWidth='1.5' strokeLinecap="round" strokeLinejoin="round">
              <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>
            </svg>
            <span>Key stays in your browser. Never sent to our servers.</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="mono">↳</span>
            <span>Don't have one?{" "}
              <a href="http://mem0.ai/" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>Check out Mem0</a>.
            </span>
          </span>
        </div>
      </form>
    </section>
  )
}

export default Hero