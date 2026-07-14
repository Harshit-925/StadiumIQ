import { z } from 'zod';

/** Schema for venue analysis form */
export const venueAnalysisSchema = z.object({
  venue_id: z.string().min(1, 'Venue is required'),
  zone_densities: z.record(
    z.string(),
    z.number().min(0, 'Density cannot be negative').max(10, 'Density cannot exceed 10')
  ),
  waste_recycled_kg: z
    .number()
    .min(0, 'Cannot be negative'),
  waste_total_kg: z
    .number()
    .min(1, 'Total waste must be greater than 0'),
});

/** Schema for fan assistant queries */
export const fanAssistSchema = z.object({
  query: z
    .string()
    .min(1, 'Please enter a question')
    .max(500, 'Question is too long (max 500 characters)'),
  language: z.enum(['en', 'es', 'fr', 'de', 'pt', 'ja'], {
    required_error: 'Language is required',
  }),
  venue_id: z.string().optional(),
});

/** Schema for authentication forms */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
});

/** Type inference helpers */
export type VenueAnalysisFormData = z.infer<typeof venueAnalysisSchema>;
export type FanAssistFormData = z.infer<typeof fanAssistSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
