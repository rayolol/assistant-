import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Label,
 } from "@radix-ui/react-dropdown-menu";
 import React from "react";



export const Dropdown = ({ children }: { children: [React.ReactNode, React.ReactNode] }) => {

    const [PrevURL, setPrevURL] = React.useState<string | null>(null);
    const [file, setFile] = React.useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files![0];
        setFile(selectedFile);

        if(selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPrevURL(reader.result as string);
            }

            reader.readAsDataURL(selectedFile);
        } else {
            setPrevURL(null)
        }
    };
    const handleUpload = () => {
        if(file) {


            console.log("Uploading file:", file);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children[0]}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem>
                        {children[1]}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
 };

 export default Dropdown;
