import { NavLink, Outlet } from "react-router-dom";
import { coins } from "../../data/coins";

export function CoinLayout() {
    return (
        <div className="coin-layout">
            <aside className="coin-sidebar">
                <div className="coin-sidebar__title">Assets</div>
                <nav className="coin-sidebar__nav">
                    {coins.map((coin) => (
                        <NavLink
                            key={coin.id}
                            to={`/${coin.id}`}
                            className={({ isActive }) =>
                                isActive ? "coin-link is-active" : "coin-link"
                            }
                        >
                            <span>{coin.name}</span>
                            <span className="coin-link__symbol">{coin.symbol}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <section className="coin-content">
                <Outlet />
            </section>
        </div>
    );
}
