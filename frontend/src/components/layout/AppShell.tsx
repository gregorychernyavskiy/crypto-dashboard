import { type ReactNode } from "react";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({children}:AppShellProps) {
    return (
        <div className="app-shell">
            <Header />
            <main className="app-main">{children}</main>
            <Footer />
        </div>
    );
}