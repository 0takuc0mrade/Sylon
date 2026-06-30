"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set. Auth disabled.");
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || process.env.PRIVY_CLIENT_ID}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#A57365",
          logo: undefined,
        },
        loginMethods: ["email", "google"],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
