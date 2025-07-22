import { create } from "zustand"


interface streamStore {

    text: string;
    setText: (response: string) => void
    clearText: () => void
}

export const useStreamStore = create<streamStore>()((set) => {

    return {
        text: "",
        setText: (chunk: string) => set({
            text: chunk
        }),
        clearText: () => set({
            text: ""
        })
    }
})