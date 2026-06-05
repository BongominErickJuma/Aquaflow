import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./features/auth/AuthProvider";
import { MessagesProvider } from "./features/messages/MessagesProvider";
import { NotificationsProvider } from "./features/notifications/NotificationsProvider";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <MessagesProvider>
        <NotificationsProvider>
          <RouterProvider router={router} />
        </NotificationsProvider>
      </MessagesProvider>
    </AuthProvider>
  </StrictMode>,
);
