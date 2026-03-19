import z from "zod";

const EnvSchema = z.object({
  VITE_APP_NAME: z.string().default('Katalyst Admin'),
  VITE_APP_ENVIRONMENT: z.string().default('development'),
  VITE_API_BASE_URL: z.string().default('http://localhost:5173'),
  VITE_API_TIMEOUT: z.string().default('30000'),
  VITE_AUTH_LOGIN_PATH: z.string().default('/auth/login'),
  VITE_AUTH_TOKEN_KEY: z.string().default('katalyst_auth_token'),
  VITE_AUTH_CURRENT_USER_KEY: z.string().default('katalyst_auth_current_user'),
  VITE_USE_MSW: z.string().default('false'),
  VITE_ENABLE_PUBLIC_CODE_EXAMPLES: z.string().default('false'),
  VITE_SIDEBAR_DEFAULT_WIDTH: z.string().default('288'),
  VITE_SIDEBAR_MIN_WIDTH: z.string().default('240'),
  VITE_SIDEBAR_MAX_WIDTH: z.string().default('864'),
  VITE_ENABLE_SIDEBAR_RESIZE: z.string().default('true'),
});

export default EnvSchema;

export type EnvSchemaType = z.infer<typeof EnvSchema>;
