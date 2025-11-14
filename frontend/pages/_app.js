// pages/_app.js
import "../styles/globals.css";
import { ApiProvider } from "../context/ApiContext";
import { ToastProvider } from "../context/ToastContext";

export default function MyApp({ Component, pageProps }) {
  return (
    <ApiProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </ApiProvider>
  );
}
