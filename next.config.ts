import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  // Los argumentos de las Server Actions de acceso contienen contraseñas.
  logging: { serverFunctions: false },
};

export default config;
