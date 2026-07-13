import { Response } from 'express';

export const successResponse = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const paginatedResponse = (
  res: Response,
  data: unknown,
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): Response => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 400
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
