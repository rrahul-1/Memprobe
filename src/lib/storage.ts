export const storage = {
    getApiKey: () => {
        return localStorage.getItem("mem0Apikey");
    },
    setApiKey: (apikey: string) => {
        localStorage.setItem("mem0Apikey", apikey);
    },
    remoteApiKey: () => {
        localStorage.removeItem("mem0Apikey");
    },
    
    getProjectName: () => {
        return localStorage.getItem("mem0ProjectName");
    },
    setProjectName: (apikey: string) => {
        localStorage.setItem("mem0ProjectName", apikey);
    },
    remoteProjectNamey: () => {
        localStorage.removeItem("mem0ProjectName");
    },


}