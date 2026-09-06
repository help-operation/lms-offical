import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AddressSchema = z.object({
  // Permanent address
  permanentCountry: z.string().max(100).optional(),
  permanentDivision: z.string().max(100).optional(),
  permanentDistrict: z.string().max(100).optional(),
  permanentThana: z.string().max(100).optional(),
  permanentUnion: z.string().max(100).optional(),
  permanentPostCode: z.string().max(10).optional(),
  permanentAddress: z.string().max(500).optional(),

  // Present address
  sameAsPermanent: z.boolean().optional(),
  presentCountry: z.string().max(100).optional(),
  presentDivision: z.string().max(100).optional(),
  presentDistrict: z.string().max(100).optional(),
  presentThana: z.string().max(100).optional(),
  presentUnion: z.string().max(100).optional(),
  presentPostCode: z.string().max(10).optional(),
  presentAddress: z.string().max(500).optional(),
});
export class AddressDto extends createZodDto(AddressSchema) {}
