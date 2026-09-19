import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/scss/index.scss";

import { Provider } from "react-redux";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import store from "./app/store.jsx";

// Data router required for React Router 7 useBlocker (edit-user unsaved guard).
const router = createBrowserRouter([
  {
    path: "*",
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <div id="Index">
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </div>
);
