import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  profile_image_url: Joi.string().uri().allow('', null),
}).min(1);

export const updateDriverProfileSchema = Joi.object({
  license_number: Joi.string().min(5).max(50),
}).min(1);

export const registerDeviceSchema = Joi.object({
  device_type: Joi.string().max(50).required(),
  token: Joi.string().required(),
  platform: Joi.string().valid('ios', 'android', 'web').required(),
});

export const addFavoriteLocationSchema = Joi.object({
  name: Joi.string().max(50).required(),
  icon: Joi.string().max(50).default('home'),
  address: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
}); 