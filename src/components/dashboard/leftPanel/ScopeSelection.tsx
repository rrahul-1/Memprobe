import { useState, useRef, useEffect } from "react";

type scopeArguments = {
    name?: string
    dropdownOptions: string[]
    onChange: (name: string) => void;
    type: "user" | "agent" | "app" | "run"
}
const ScopeSelection = ({ type, name, dropdownOptions, onChange }: scopeArguments) => {
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpenDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className='relative font-["Geist_Mono",ui-monospace,"JetBrains_Mono","SFMono-Regular",monospace]'
            ref={dropdownRef}>
            <button className='w-full flex justify-between items-center h-7.5 px-2 rounded-md text-[#EDECF0] text-[12px] bg-[#0A0A0B] border border-[#2E2E38] cursor-pointer'
                onClick={() => {
                    setOpenDropdown(!openDropdown)
                }}>
                <span className='flex gap-2 items-center'>
                    <span className='text-[#5C5A6A]'>
                        {type === "user" && "user_id"}
                        {type === "agent" && "agent_id"}
                        {type === "app" && "app_id"}
                        {type === "run" && "run_id"}
                    </span>
                    <span className="overflow-hidden text-ellipsis">
                        {name}
                    </span>
                </span>
                <div className="text-[#5C5A6A]">
                    <svg className="shrink" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                </div>
            </button>
            {openDropdown && (
                <div className="absolute left-0 top-full z-50 w-full">
                    <div className="rounded-md border border-[#232329] bg-[#111113] p-1 shadow-2xl mt-0.5">
                        {dropdownOptions.length > 0 && dropdownOptions.map((option) => (
                            <button className='w-full items-center h-7.5 px-2 text-[#EDECF0] text-[12px] cursor-pointer'
                                key={option}
                                onClick={() => {
                                    onChange(option)
                                    setOpenDropdown(false)
                                }}>
                                <span className='flex gap-2 items-center'>
                                    <span className='text-[#5C5A6A]'>
                                        user_id
                                    </span>
                                    <span className="overflow-hidden text-ellipsis">
                                        {option}
                                    </span>
                                </span>
                            </button>

                        ))}
                        {dropdownOptions.length == 0 && (
                            <div className='w-full items-center h-7 px-2 text-[#5C5A6A] text-[12px] text-center'
                                onClick={() => {
                                    setOpenDropdown(false)
                                }}>No records
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ScopeSelection