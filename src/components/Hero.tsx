"use client";

import { RefObject, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import Image from "next/image";

type HeroProps = {
  inputRef: RefObject<HTMLInputElement | null>;
};

const FEATURES = [
  {
    title: "Scope selector",
    description:
      "Filter memories across user_id, agent_id, app_id, and run_id with AND / OR matching.",
  },
  {
    title: "Retrieval tester",
    description:
      "Debug semantic retrieval exactly like your AI agent sees it with ranked results and score inspection.",
  },
  {
    title: "Timeline tracing",
    description:
      "Inspect CREATED, UPDATED, and DELETED memory events with full change history.",
  },
  {
    title: "Metadata explorer",
    description:
      "Inspect categories, timestamps, raw JSON payloads, and retrieval context in one panel.",
  },
  {
    title: "Add memory playground",
    description:
      "Simulate multi-turn conversations, attach metadata, and test memory creation flows.",
  },
  {
    title: "Organizations & projects",
    description:
      "Switch between Mem0 organizations and projects without changing environments.",
  },
];

const Hero = ({ inputRef }: HeroProps) => {
  const router = useRouter();

  const [mem0ApiKey, setMem0ApiKey] = useState("");
  const [loading, setLoading] = useState(false);

  const isDisabled = mem0ApiKey.trim() === "" || loading;

  const validateApikey = async (): Promise<boolean> => {
    const response = await fetch("/api/validate", {
      headers: {
        "mem0-apiKey": mem0ApiKey,
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

    setLoading(true);

    const isLegit = await validateApikey();

    if (isLegit) {
      storage.setApiKey(mem0ApiKey);
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="pb-32">
      {/* HERO */}
      <section className="pt-10">
        <div className="flex items-center gap-2 h-6.5 w-fit px-2.5 border border-[#232329] rounded-full text-[#9896A4] bg-[#111113] text-[12px]">
          <span className="bg-[#1DD5A3] w-1.5 h-1.5 rounded-full" />
          <span className="font-medium tracking-wide">
            OPEN SOURCE · v0.1
          </span>
        </div>

        <h1 className="text-[#EDECF0] text-7xl leading-[1.02] tracking-[-3px] mt-7 font-medium max-w-4xl">
          See what your
          <br />
          AI agents actually remember.
        </h1>

        <p className="mt-7 text-[#9896A4] text-[18px] leading-8 max-w-2xl">
          The developer layer on top of Mem0 - inspect, debug,
          and understand your agent&apos;s memory retrieval,
          metadata, and timeline behavior in real time.
        </p>

        {/* CONNECT */}
        <form
          className="max-w-3xl mt-10"
          onSubmit={saveApiKey}
        >
          <div className='flex gap-2 items-stretch p-1.5 bg-[#111113] rounded-2xl border border-[#2E2E38] shadow-[0_0_0_1px_rgba(255,255,255,0.03)] font-["Geist_Mono",ui-monospace,"JetBrains_Mono","SFMono-Regular",monospace]'>
            <div className='text-[#5C5A6A] flex gap-2 items-center h-12 pl-2.5 shrink-0'>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <>
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </>
              </svg>

              <span className="text-[13px]">
                MEM0_API_KEY
              </span>
            </div>

            <input
              className="px-2 bg-transparent text-[#EDECF0] text-[14px] tracking-[1px] flex grow outline-none border-0 focus:ring-0 focus-within:border-[#5a51ad] focus-within:shadow-[0_0_24px_rgba(124,110,248,0.40)] focus-within:bg-[#141418] focus-within:rounded-2xl"
              placeholder="m0-•••• •••• •••• ••••"
              ref={inputRef}
              onChange={(e) => setMem0ApiKey(e.target.value)}
              value={mem0ApiKey}
            />

            <button
              className={`flex gap-1.5 items-center rounded-xl font-medium px-4 m-1 duration-150 text-[14px]
              ${isDisabled
                  ? "bg-[#2A2A32] text-[#6B6B76] cursor-not-allowed"
                  : "bg-[#7C6EF8] text-white hover:bg-[#9182FA]"
                }`}
              disabled={isDisabled}
            >
              {loading ? "Connecting..." : "Connect"}

              {!loading && (
                <span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <>
                      <path d="M5 12h14" />
                      <path d="m13 5 7 7-7 7" />
                    </>
                  </svg>
                </span>
              )}
            </button>
          </div>

          <div className="text-[#5C5A6A] mt-3.5 flex gap-5 text-[12px] px-5 flex-wrap">
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="m9 12 2 2 4-4" />
                </>
              </svg>

              <span>
                Key stays in your browser. Never stored server-side.
              </span>
            </span>

            <span className="flex items-center gap-2">
              <span>↳</span>

              <span>
                Don&apos;t have one?{" "}
                <a
                  href="https://mem0.ai"
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  Check out Mem0
                </a>
              </span>
            </span>
          </div>
        </form>

        {/* MINI STATS */}
        <div className="grid grid-cols-4 mt-20 border-y border-[#232329]">
          {[
            ["All memories", "Browse every memory"],
            ["Retrieval tester", "Debug semantic search"],
            ["Timeline view", "Trace memory history"],
            ["Raw JSON", "Inspect metadata deeply"],
          ].map(([title, subtitle]) => (
            <div
              key={title}
              className="py-6 px-6 border-r border-[#232329] last:border-r-0"
            >
              <div className="text-[#EDECF0] text-[22px] font-medium">
                {title}
              </div>

              <div className="text-[#5C5A6A] text-[13px] mt-1">
                {subtitle}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="mt-28">
        <div className="mb-10">
          <p className="text-[#7C6EF8] text-[13px] font-medium tracking-wide uppercase">
            Real dashboard
          </p>

          <h2 className="text-[#EDECF0] text-5xl tracking-[-2px] mt-4 font-medium">
            Built for debugging AI memory systems.
          </h2>

          <p className="text-[#9896A4] text-[17px] mt-5 max-w-3xl leading-8">
            Browse memories, inspect metadata, test retrieval,
            trace timeline events, and debug scoped memory behavior
            from a single interface.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-[#232329] bg-[#0D0D11] shadow-[0_0_80px_rgba(124,110,248,0.08)]">
          {/* <img
            src="/dashboard-preview.png"
            alt="Memprobe dashboard"
            className="w-full object-cover"
          /> */}
          <Image
            src="/memprobe_dashboard.png"
            alt="Memprobe dashboard"
            width={1600}
            height={900}
            className="w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="mt-32">
        <div className="mb-14">
          <p className="text-[#7C6EF8] text-[13px] font-medium tracking-wide uppercase">
            Features
          </p>

          <h2 className="text-[#EDECF0] text-5xl tracking-[-2px] mt-4 font-medium">
            Everything you need to inspect memory.
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-[#232329] bg-[#111113] p-7 hover:border-[#34343d] duration-150"
            >
              <div className="w-10 h-10 rounded-xl bg-[#17171C] border border-[#232329] flex items-center justify-center text-[#7C6EF8]">
                <div className="w-2 h-2 rounded-full bg-[#7C6EF8]" />
              </div>

              <h3 className="text-[#EDECF0] text-[20px] mt-5 font-medium">
                {feature.title}
              </h3>

              <p className="text-[#9896A4] text-[15px] leading-7 mt-3">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-32">
        <div className="mb-14">
          <p className="text-[#7C6EF8] text-[13px] font-medium tracking-wide uppercase">
            Workflow
          </p>

          <h2 className="text-[#EDECF0] text-5xl tracking-[-2px] mt-4 font-medium">
            From API key to memory debugging in seconds.
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            "Connect your Mem0 API key",
            "Select scopes and filters",
            "Inspect memory retrieval",
            "Trace timeline & metadata",
          ].map((step, index) => (
            <div
              key={step}
              className="border border-[#232329] bg-[#111113] rounded-2xl p-6"
            >
              <div className="text-[#7C6EF8] text-sm font-medium">
                0{index + 1}
              </div>

              <p className="text-[#EDECF0] text-[17px] leading-7 mt-5">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-36 border-t border-[#232329] pt-28">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#7C6EF8] text-[13px] font-medium tracking-wide uppercase">
            Start inspecting
          </p>

          <h2 className="text-[#EDECF0] text-6xl leading-[1.1] tracking-[-3px] mt-5 font-medium">
            Stop treating memory like a black box.
          </h2>

          <p className="text-[#9896A4] text-[18px] leading-8 mt-7 max-w-2xl mx-auto">
            Connect your Mem0 API key and inspect every memory,
            retrieval result, metadata field, and timeline event
            from one unified dashboard.
          </p>

          <button
            onClick={() => inputRef.current?.focus()}
            className="mt-10 bg-[#7C6EF8] hover:bg-[#9182FA] text-white px-6 h-12 rounded-xl text-[15px] font-medium duration-150"
          >
            Connect Mem0
          </button>
        </div>
      </section>
    </div>
  );
};

export default Hero;