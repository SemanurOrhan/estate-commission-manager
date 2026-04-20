import { Prop, Schema, SchemaFactory  } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PropertyDocument = Property & Document;

export enum PropertyType {
  SALE = 'sale',
  RENTAL = 'rental',
}

@Schema({ timestamps: true })

export class Property {
  @Prop({ required: true })
   address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  postcode: string;

  @Prop({ required: true, enum: PropertyType })
  type: PropertyType;

  @Prop({ required: true, min: 0 })
  askingPrice: number;

  @Prop()
  description?: string;


}

export const PropertySchema = SchemaFactory.createForClass(Property);
