import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import App from "../App";
import { OverviewPage } from "../pages/OverviewPage";
import { CoinPage } from "../pages/CoinPage";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "bitcoin", element: <CoinPage coinId="bitcoin" /> },
      { path: "ethereum", element: <CoinPage coinId="ethereum" /> },
      { path: "cardano", element: <CoinPage coinId="cardano" /> },
      { path: "bnb", element: <CoinPage coinId="bnb" /> },
      { path: "solana", element: <CoinPage coinId="solana" /> },
      { path: "xrp", element: <CoinPage coinId="xrp" /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

export default router;
