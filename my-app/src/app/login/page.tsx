"use client";

import React, { useState, FormEvent } from 'react';
import { useUserStore } from '../../../types/UserStore';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');
    const { login } = useUserStore();
    const [debugMode, setDebugMode] = useState<boolean>(false);
    const router = useRouter();
    
    const handleLogin = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            if (debugMode) {
                login("Guest", "Guest@example.com");
                router.push('/chat');
            } else {
                // Form validation
                if (!username.trim()) {
                    setError('Username is required');
                    return;
                }
                
                if (!email.trim()) {
                    setError('Email is required');
                    return;
                }
                
                // Email format validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    setError('Please enter a valid email address');
                    return;
                }
                
                login(username, email);
                router.push('/chat');
            }
        } catch (error) {
            console.log("Error logging in: ", error);
            setError('Login failed. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <form 
                className="w-80 h-auto p-5 bg-slate-600 shadow-2xl rounded-2xl flex flex-col" 
                onSubmit={handleLogin}
            >
                <div className="flex items-center mb-4">
                    <label className="mr-2 text-white">Debug Mode</label>
                    <input 
                        type="checkbox" 
                        onChange={() => setDebugMode(!debugMode)} 
                        className="h-4 w-4"
                    />
                </div>
                
                {!debugMode && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block mb-2 text-white">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-white">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <button 
                    type="submit"
                    className="p-3 mt-5 shadow-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                >
                    Login
                </button>
            </form>
        </div>
    );
}

export default LoginPage;
