import { Message } from "@/app/types/schemas";



export const SystemsMessage = ({message}: {message: Message}) => {
    return (
        <div className="flex flex-row p-4 text-md text-gray-500">
            <p>{JSON.stringify(message.content)}</p>
            <p>{JSON.stringify(message.flags)}</p>
        </div>
    )
}