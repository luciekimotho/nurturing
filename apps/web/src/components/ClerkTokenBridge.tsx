import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { configureAuthTokenGetter } from "../lib/api";

export default function ClerkTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    configureAuthTokenGetter(() => getToken());
    return () => configureAuthTokenGetter(null);
  }, [getToken]);

  return null;
}
