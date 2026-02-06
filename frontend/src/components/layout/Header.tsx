import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Header() {
    const [dark, setDark] = useState(() => {
        return localStorage.getItem("theme") !== "light";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        localStorage.setItem("theme", dark ? "dark" : "light");
    }, [dark]);

    return (
        <header className="app-header">
            <Link to="/" className="app-header__logo">
                <span className="app-header__dot" />
                <span className="app-header__title">AnchorFlow</span>
            </Link>
            <button
                className="theme-toggle"
                onClick={() => setDark(d => !d)}
                aria-label="Toggle theme"
            >
                <span className="theme-toggle__circle" />
            </button>
        </header>
    );
}