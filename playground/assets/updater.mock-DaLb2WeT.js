async function n(){return{available:!1}}async function a(){throw new Error("Cannot download updates in development mode")}export{n as checkForUpdates,a as downloadAndInstallUpdate};
