import { type ReactNode } from "react";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({children}:AppShellProps) {
    return (
        <div>
            <Header />
            <main>{children}</main>
            <Footer />
        </div>
    );
}