import { NumberTypes } from './type';

export class BufferWriter {
	private bufferList = [];

	string(str: string): void {
		this.bufferList.push(new Buffer(str, 'binary'));
	}

	size(s: number) {
		if (s < 0) {
			throw new Error("Sizes must be positive");
		}

		if (s < 0x7F) {
			return this.number(s, 'u8');
		}

		if (s < 0x3FFF) {
			return this.number(s | 0x8000, 'u16');
		}

		if (s < 0x1FFFFFFF) {
			// Note: using s | 0xC0000000 results in a signed integer
			return this.number(s + 0xC0000000, 'u32');
		}

		throw new Error(`Can not encode size; too large: ${s}`);
	}

	number(val: number, bit: NumberTypes): void {
		let buffer: Buffer;

		switch (bit) {
			case 'u8':
				buffer = Buffer.alloc(1);
				buffer.writeUint8(val);
				break;
			case 'u16':
				buffer = Buffer.alloc(2);
				buffer.writeUint16BE(val);
				break;
			case 'u32':
				buffer = Buffer.alloc(4);
				buffer.writeUint32BE(val);
				break;
			case 'double':
				buffer = Buffer.alloc(8);
				buffer.writeDoubleBE(val);
				break;
			default:
				throw new Error('Unknown number type');
		}

		this.bufferList.push(buffer);
	}

	toBuffer(): Buffer {
		return Buffer.concat(this.bufferList);
	}
}
