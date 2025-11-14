import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
    state: () => ({
        duplexLevel: 1,
        userName: "Guest",
        initialSelectedUnitId: -1,
        highResLoaded: true,
    }),
    actions: {
        setDuplexLevel(level: number) {
            console.log(`Setting global duplex level to ${level}`);
            this.duplexLevel = level;
        },
        setHighResLoaded(loaded: boolean) {
            this.highResLoaded = loaded;
        }
    }
});