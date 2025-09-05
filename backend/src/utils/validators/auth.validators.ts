import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone_number: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be between 10-15 digits',
    }),
  user_type: Joi.string().valid('rider', 'driver').required(),
});

export const loginSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const verifyPhoneSchema = Joi.object({
  code: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required(),
}); 