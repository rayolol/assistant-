import React from 'react';



export const EmptyState = ({username}: {username: string}) => {
    return (
        <div className="text-center px-4 py-8 text-foreground">
            <h1 className="font-semibold text-xl sm:text-2xl text-center mb-4">
                Welcome, {username}!
            </h1>          
            <p className="text-accent-foreground max-w-md mx-auto">
                Start a new conversation by typing a message below.
            </p>
        </div>
    )
}