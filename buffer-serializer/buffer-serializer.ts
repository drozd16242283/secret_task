import { BufferSchema, NumberTypes, NumberTypesEnum, DataType, AvailableTypes, NestedDataObject } from './type';
import { BufferWriter } from './buffer-writer';
import { BufferReader } from './buffer-reader';

const ENDING_MARKER = 0x21;

export default class BufferSerializer {
	private readonly schema: BufferSchema;
	private buffWriter: BufferWriter;
	private buffReader: BufferReader;

	constructor(schema: BufferSchema) {
		this.schema = schema;
	}

	toBuffer(data: DataType): Buffer {
		this.buffWriter = new BufferWriter();

		this.serializeToBufferInternal(data);

		return this.buffWriter.toBuffer();
	}

	fromBuffer(buff: Buffer, offset: number = 0) {
		this.buffReader = new BufferReader(buff, offset);
		return this.deserializeFromBufferInternal();
	}

	private deserializeFromBufferInternal() {
		const code = this.buffReader.number(NumberTypesEnum.u8);

		switch (code) {
			// 0x21 is a marker for ending objects and arrays

			case 0x2B: // + = positive 8-bit integer
				return this.buffReader.number(NumberTypesEnum.u8);

			case 0x2D: // - = negative 8-bit integer
				return - this.buffReader.number(NumberTypesEnum.u8);

			case 0x42: // B = Buffer object
				return this.buffReader.buffer(this.buffReader.size());

			case 0x44: // D = Date object with milliseconds
				return this.fromBufferInternalObjectDateD();

			case 0x54: // T = Date object without milliseconds
				return this.fromBufferInternalObjectDateT();

			case 0x49: // I = negative 32-bit integer
				return - this.buffReader.number(NumberTypesEnum.u32);

			case 0x4f: // O = object, generic
				return this.fromBufferInternalObjectGeneric();

			case 0x50: // P = positive 32-bit integer
				return this.buffReader.number(NumberTypesEnum.u32);

			case 0x61: // a = Array, dense
				return this.fromBufferInternalArrayDense();

			case 0x53: // S = Set
				return this.fromSetInternal();

			case 0x4D: // M = Map
				return this.fromMapInternal();

			case 0x64: // d = 8-byte double
				return this.buffReader.number(NumberTypesEnum.double);

			case 0x69: // i = negative 16-bit integer
				return - this.buffReader.number(NumberTypesEnum.u16);

			case 0x70: // p = positive 16-bit integer
				return this.buffReader.number(NumberTypesEnum.u16)

			case 0x73: // s = string
				return this.buffReader.string(this.buffReader.size());

			case 0x74: // t = true
				return true;

			case 0x66: // f = false
				return false;
		}

		throw new Error(`Unknown code: ${code}`);
	}

	private serializeToBufferInternal(data: DataType | AvailableTypes): void {
		switch (typeof data) {
			case 'object':
				this.toBufferInternalObject(data as DataType);
				break;
			case 'string':
				this.toBufferInternalString(data);
				break;
			case 'number':
				this.toBufferInternalNumber(data);
				break;
			case 'boolean':
				this.toBufferInternalBoolean(data);
				break;
			default:
				throw new Error('Invalid type');
		}
	}

	private serializeToTypedBuffer(data: DataType | AvailableTypes, key: string, nestedKey?: string): void {
		let schemaType = this.schema[key] as string;

		if (nestedKey) {
			schemaType = this.schema[nestedKey][key];
		}

		if (!schemaType) {
			return this.serializeToBufferInternal(data);
		}

		if (Object.keys(NumberTypesEnum).includes(schemaType)) {
			let number = Number(data);
			if (!Number.isInteger(number)) {
				this.buffWriter.number(0x64, NumberTypesEnum.u8); // d
			} else if (number > 0) {
				this.buffWriter.number(0x50, NumberTypesEnum.u8); // P
			} else {
				number = Math.abs(number);
				this.buffWriter.number(0x49, NumberTypesEnum.u8); // I
			}

			this.buffWriter.number(number, schemaType as NumberTypes);
			return;
		}

		if (typeof schemaType === 'object' || schemaType === 'Set' || schemaType === 'Map') {
			return this.toBufferInternalObject(data as DataType, key);
		}

		// Does not need a serialization
		if (schemaType === 'string') {
			return this.toBufferInternalString(String(data));
		}

		if (schemaType === 'date') {
			return this.toBufferInternalObjectDate(data as Date);
		}

		if (schemaType === 'bool' || schemaType === 'boolean') {
			return this.toBufferInternalBoolean(Boolean(data));
		}
	}

	// Serializer helper methods
	private toBufferInternalObject(data: DataType, key?: string): void {
		if (Array.isArray(data)) {
			return this.toBufferInternalArray(data, key);
		}

		if (data instanceof Set) {
			return this.toSetInternal(data);
		}

		if (data instanceof Map) {
			return this.toMapInternal(data, key);
		}

		if (data instanceof Date) {
			return this.toBufferInternalObjectDate(data as Date);
		}

		return this.toBufferInternalObjectGeneric(data);
	}

	private toBufferInternalObjectGeneric(data: DataType): void {
		this.buffWriter.string('O');
		const keys = Object.keys(data);

		for (let i = 0; i < keys.length; i += 1) {
			this.toBufferInternalKey(keys[i]);
			this.serializeToTypedBuffer(data[keys[i]] as string, keys[i]);
		}

		this.buffWriter.string('!');
	}

	private toBufferInternalArray(data: Array<NestedDataObject | AvailableTypes>, key: string): void {
		this.buffWriter.string('a'); // dense

		if (typeof data[0] === 'object') {
			// Write each nested object as generic object with O code
			data.forEach((object) => {
				this.buffWriter.string('O');
				const objectKeys = Object.keys(object);

				for (let i = 0; i < objectKeys.length; i++) {
					this.toBufferInternalKey(objectKeys[i]);
					this.serializeToTypedBuffer(object[objectKeys[i]], objectKeys[i], key);
				}

				this.buffWriter.string('!');

			});
			this.buffWriter.string('!');
			return;
		}

		for (let i = 0; i < data.length; i++) {
			this.serializeToTypedBuffer(data[i], null, key);
		}

		this.buffWriter.string('!');
		return;
	}

	private toSetInternal(data: Set<AvailableTypes>): void {
		this.buffWriter.string('S'); // Set

		data.forEach((el) => {
			this.serializeToTypedBuffer(el, null);
		})

		this.buffWriter.string('!');
		return;
	}

	private toMapInternal(data: Map<any, AvailableTypes>, externalKey: string) {
		this.buffWriter.string('M'); // Map

		data.forEach((value, key) => {
			this.serializeToBufferInternal(key);
			this.serializeToTypedBuffer(value, key, externalKey);
		});

		this.buffWriter.string('!');
		return;
	}

	private toBufferInternalKey(data: string): void {
		if (/^[a-zA-Z0-9_.-]*$/.test(data)) {
			return this.serializeToBufferInternal(data);
		}
	}

	private toBufferInternalNumber(val: number): void {
		if (Math.floor(val) == val) {
			// an integer
			if (val < 0) {
				const abs = Math.abs(val);
				if (abs <= 0xFF) {
					this.buffWriter.number(0x2D, NumberTypesEnum.u8); // -
					this.buffWriter.number(abs, NumberTypesEnum.u8);
					return;
				}

				if (abs <= 0xFFFF) {
					this.buffWriter.number(0x69, NumberTypesEnum.u8);  // i
					this.buffWriter.number(abs, NumberTypesEnum.u16);
					return;
				}

				if (abs <= 0xFFFFFFFF) {
					this.buffWriter.number(0x49, NumberTypesEnum.u8);  // I
					this.buffWriter.number(abs, NumberTypesEnum.u32);
					return;
				}
			} else {
				if (val <= 0xFF) {
					this.buffWriter.number(0x2B, NumberTypesEnum.u8); // +
					this.buffWriter.number(val, NumberTypesEnum.u8);
					return;
				}

				if (val <= 0xFFFF) {
					this.buffWriter.number(0x70, NumberTypesEnum.u8); // p
					this.buffWriter.number(val, NumberTypesEnum.u16);
					return;
				}

				if (val <= 0xFFFFFFFF) {
					this.buffWriter.number(0x50, NumberTypesEnum.u8); // P
					this.buffWriter.number(val, NumberTypesEnum.u32);
					return;
				}
			}
		}

		this.buffWriter.number(0x64, NumberTypesEnum.u8); // d
		this.buffWriter.number(val, NumberTypesEnum.double);
	}

	private toBufferInternalObjectDate(data: Date): void {
		let seconds = data.getTime();
		let ms = seconds % 1000;
		seconds = Math.floor(seconds / 1000);

		if (ms) {
			this.buffWriter.number(0x44, NumberTypesEnum.u8); // D
			this.buffWriter.number(seconds, NumberTypesEnum.u32);
			this.buffWriter.number(ms, NumberTypesEnum.u16);
		} else {
			this.buffWriter.number(0x54, NumberTypesEnum.u8); // T
			this.buffWriter.number(seconds, NumberTypesEnum.u32);
		}
	}

	private toBufferInternalString(data: string): void {
		this.buffWriter.number(0x73, NumberTypesEnum.u8); // s
		this.buffWriter.size(data.length);
		this.buffWriter.string(data);
	};

	private toBufferInternalBoolean(data: boolean): void {
		if (data) {
			this.buffWriter.number(0x74, NumberTypesEnum.u8); // t
		} else {
			this.buffWriter.number(0x66, NumberTypesEnum.u8); // f
		}
	}

	// Deserializer helper methods
	private fromBufferInternalObjectDateD(): Date {
		const date = new Date();
		const seconds = this.buffReader.number(NumberTypesEnum.u32) * 1000;
		date.setTime(seconds + this.buffReader.number(NumberTypesEnum.u16));

		return date;
	}

	private fromBufferInternalObjectDateT(): Date {
		const date = new Date();
		date.setTime(this.buffReader.number(NumberTypesEnum.u32) * 1000);

		return date;
	}

	private fromBufferInternalObjectGeneric(): DataType {
		const acc = {};
		// Read until "!"
		while (this.buffReader.lookup() !== ENDING_MARKER) {
			const key = this.deserializeFromBufferInternal() as string;
			acc[key] = this.deserializeFromBufferInternal();
		}

		// Consume the "!"
		this.buffReader.skip();

		return acc;
	}

	private fromBufferInternalArrayDense(): AvailableTypes[] | NestedDataObject[] {
		const result = [];

		while (this.buffReader.lookup() !== ENDING_MARKER) {
			result.push(this.deserializeFromBufferInternal());
		}

		this.buffReader.skip();

		return result;
	}

	private fromSetInternal(): Set<number | {}> {
		const res = new Set();

		while (this.buffReader.lookup() !== ENDING_MARKER) {
			res.add(this.deserializeFromBufferInternal());
		}

		this.buffReader.skip();

		return res;
	}

	private fromMapInternal(): Map<string, AvailableTypes> {
		const res = new Map();

		while (this.buffReader.lookup() !== ENDING_MARKER) {
			const key = this.deserializeFromBufferInternal() as string;
			res.set(key, this.deserializeFromBufferInternal());
		}

		this.buffReader.skip();

		return res;
	}
}
