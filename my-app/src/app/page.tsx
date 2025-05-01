"use client";


import Link from "next/link";
import React from "react";
import { useUserStore } from "./hooks/StoreHooks/UserStore";





export default function Home() {
  const { isAuthenticated } = useUserStore();


  if(!isAuthenticated) {
    return(
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          Login
        </Link>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">      
      <Link href="/chat" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
        Go to Chat
      </Link>
    </main>
  );
}
