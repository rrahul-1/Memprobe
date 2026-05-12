import { View } from '@/app/dashboard/DashboardClient';
import ScopeSelection from './leftPanel/ScopeSelection';

type params = {
  users: string[]
  agents: string[]
  apps: string[]
  runs: string[]
  selectedUser: string | undefined;
  selectedAgent: string | undefined;
  selectedApp: string | undefined;
  selectedRun: string | undefined;
  view: View
  setselectedUser: (user: string) => void;
  setSelectedAgent: (agent: string) => void;
  setSelectedApp: (app: string) => void;
  setSelectedRun: (run: string) => void;
  setSelectedView: (view: View) => void;
}


function getNumberOfSelectedFilers(selectedUser: string | undefined, selectedAgent: string | undefined, selectedApp: string | undefined, selectedRun: string | undefined): number {
  let count = 0;
  if (selectedUser) {
    count += 1
  }
  if (selectedAgent) {
    count += 1
  }
  if (selectedApp) {
    count += 1
  }
  if (selectedRun) {
    count += 1
  }
  return count
}

const SideBar = ({ users, agents, apps, runs, selectedUser, selectedAgent, selectedApp, selectedRun, setselectedUser, setSelectedAgent, setSelectedApp, setSelectedRun, view, setSelectedView }: params) => {

  const totalMemories = 12;
  return (
    <div className='h-full w-58 border-r border-r-[#232329] p-4 flex flex-col gap-5.5 overflow-auto bg-[#111113]'>
      <div className="flex flex-col gap-2 text-[#9e9bbb]">
        <div className='flex justify-between text-[10px]'>
          <div className='tracking-[1.4px] font-medium'>SCOPE</div>
          <span className='flex gap-1 items-center '>
            <span className='bg-[#7C6EF8] rounded-full w-1.5 h-1.5'></span>
            <span>{getNumberOfSelectedFilers(selectedUser, selectedAgent, selectedApp, selectedRun)}</span>
          </span>
        </div>

        <div className='flex flex-col gap-1.5 mt-1'>
          <ScopeSelection type="user" name={selectedUser} onChange={setselectedUser} dropdownOptions={users} />
          <ScopeSelection type="agent" name={selectedAgent} onChange={setSelectedAgent} dropdownOptions={agents} />
          <ScopeSelection type="app" name={selectedApp} onChange={setSelectedApp} dropdownOptions={apps} />
          <ScopeSelection type="run" name={selectedRun} onChange={setSelectedRun} dropdownOptions={runs} />
        </div>
      </div>

      <div className="text-[#9e9bbb] text-[10px]">
        <div className='tracking-[1.4px] font-medium'>VIEWS</div>
        {/* ALL MEMORIES */}
        <button
          onClick={() => setSelectedView("memories")}
          className={`group relative flex items-center gap-2.5 h-8 px-2.5 rounded-md transition-colors cursor-pointer
          
          ${view === "memories"
              ? "text-[#EDECF0]"
              : "text-[#9896A4] hover:text-[#EDECF0]"
            }
        `}
        >
          {view === "memories" && (
            <span className='absolute -left-4 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#7C6EF8] rounded-full'></span>
          )}

          <svg
            className={`shrink-0 transition-colors ${view === "memories"
                ? "stroke-[#7C6EF8]"
                : "stroke-[#9896A4] group-hover:stroke-[#EDECF0]"
              }`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18M3 12h18M3 18h12"></path>
          </svg>

          <span className='text-[13px]'>
            All Memories
          </span>

          <span className='text-[11px] py-px px-1.5 bg-[#0A0A0B] border border-[#303030] rounded-sm ml-10'>
            {totalMemories}
          </span>
        </button>

        {/* RETRIEVAL TESTER */}
        <button
          onClick={() => setSelectedView("retrieval")}
          className={`group relative flex items-center gap-2.5 h-8 px-2.5 rounded-md transition-colors cursor-pointer
          
          ${view === "retrieval"
              ? "text-[#EDECF0]"
              : "text-[#9896A4] hover:text-[#EDECF0]"
            }
        `}
        >
          {view === "retrieval" && (
            <span className='absolute -left-4 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#7C6EF8] rounded-full'></span>
          )}

          <svg
            className={`shrink-0 transition-colors ${view === "retrieval"
                ? "stroke-[#7C6EF8]"
                : "stroke-[#9896A4] group-hover:stroke-[#EDECF0]"
              }`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>

          <span className='text-[13px]'>
            Retrieval tester
          </span>
        </button>

        {/* TIMELINE */}
        <button
          onClick={() => setSelectedView("timeline")}
          className={`group relative flex items-center gap-2.5 h-8 px-2.5 rounded-md transition-colors cursor-pointer
          
          ${view === "timeline"
              ? "text-[#EDECF0]"
              : "text-[#9896A4] hover:text-[#EDECF0]"
            }
        `}
        >
          {view === "timeline" && (
            <span className='absolute -left-4 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#7C6EF8] rounded-full'></span>
          )}

          <svg
            className={`shrink-0 transition-colors ${view === "timeline"
                ? "stroke-[#7C6EF8]"
                : "stroke-[#9896A4] group-hover:stroke-[#EDECF0]"
              }`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6" cy="6" r="2"></circle>
            <circle cx="6" cy="18" r="2"></circle>
            <circle cx="18" cy="8" r="2"></circle>
            <path d="M6 8v8M18 10v2a3 3 0 0 1-3 3H8"></path>
          </svg>

          <span className='text-[13px]'>
            Timeline
          </span>
        </button>
      </div>
    </div>
  )
}

export default SideBar