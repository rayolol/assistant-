import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Archive, PencilLine, Trash2 } from 'lucide-react';
import { AlertCard } from "../utils/AlertCard";
import { useState } from "react";


interface ConversationDropdownProps {
    children: React.ReactNode;
    currentConversationId: string;
    onEdit: () => void;
    setArchive: () => void;
    onDelete: () => void;
}


export const ConversationDropdown = ({children, setArchive, onEdit, onDelete } : ConversationDropdownProps) => {
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);


    return (
        <>
            <AlertCard 
                message="Are you sure you want to delete this conversation?" 
                onSubmit={onDelete}
                dialogOpen={dialogOpen}
                setDialogOpen={setDialogOpen}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {children}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={onEdit}>
                        Edit Name <PencilLine />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {setDialogOpen(true)}}>
                        <span className="flex items-center gap-2">
                            delete <Trash2/>
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={setArchive}>
                        archive <Archive />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
