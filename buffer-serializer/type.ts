export type BufferSchema = { [key: string]: string | { [key: string]: string } };

export type NumberTypes = 'u8' | 'u16' | 'u32' | 'double';

export enum NumberTypesEnum {
	u8 = 'u8',
	u16 = 'u16',
	u32 = 'u32',
	double = 'double'
}
