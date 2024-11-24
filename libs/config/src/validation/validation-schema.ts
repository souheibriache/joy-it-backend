import * as Joi from 'joi';

const APP_VALIDATION = {
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  JWT_AUTH_KEY: Joi.string().required(),
  RESET_PASSWORD_SECRET_KEY: Joi.string().required(),
};

const SWAGGER_VALIDATION = {
  SWAGGER_ENDPOINT: Joi.string().default('doc'),
  SWAGGER_USERNAME: Joi.string().default('dev'),
  SWAGGER_PASSWORD: Joi.string().default('dev'),
};

const POSTGRES_VALIDATION = {
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow(''),
  DB_NAME_DEV: Joi.string().required(),
};

const DASHBOARD_HOST_VALIDATION = {
  ADMIN_DASHBOARD_HOST: Joi.string().default('https://dev-admin.glowrita.com'),
  FRONTEND_HOST: Joi.string().default('https://dev.wedort.com'),
};

export const validationSchema = Joi.object({
  ...APP_VALIDATION,
  ...SWAGGER_VALIDATION,
  ...POSTGRES_VALIDATION,
  ...DASHBOARD_HOST_VALIDATION,
});
