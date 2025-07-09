import Joi from 'joi';

// Order validation schema
const orderSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().trim(),
  phoneNumber: Joi.string().min(10).max(15).required().trim(),
  printType: Joi.string().valid('blackAndWhite', 'color', 'custom', 'softBinding', 'spiralBinding', 'customPrint').required(),
  bindingColorType: Joi.string().valid('blackAndWhite', 'color', 'custom').optional(),
  copies: Joi.number().integer().min(1).max(1000).optional(),
  paperSize: Joi.string().valid('a4', 'a3', 'letter', 'legal').optional(),
  printSide: Joi.string().valid('single', 'double').optional(),
  selectedPages: Joi.string().optional(),
  colorPages: Joi.string().optional(),
  bwPages: Joi.string().optional(),
  specialInstructions: Joi.string().max(1000).optional()
});

// Admin login validation schema
const adminLoginSchema = Joi.object({
  username: Joi.string().required().trim(),
  password: Joi.string().required()
});

// Order status update validation schema
const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled').required()
});

export const validateOrder = (req, res, next) => {
  const { error } = orderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

export const validateAdminLogin = (req, res, next) => {
  const { error } = adminLoginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

export const validateStatusUpdate = (req, res, next) => {
  const { error } = statusUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};