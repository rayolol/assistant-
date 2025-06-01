import Link from "next/link";


export const AuthRedirect = () => {
    return(
        <div className="flex items-center justify-center h-full w-full text-red-500">
            <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="font-semibold m-3">You must be logged in to chat</p>
                <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Login
                </Link>
            </div>
        </div>
    )
}