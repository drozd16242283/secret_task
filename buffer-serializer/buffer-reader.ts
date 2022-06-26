import { NumberTypes, NumberTypesEnum } from './type';

export class BufferReader {
	private readonly readBuffer: Buffer;
	private bufferReadOffset: number;

	constructor(existingBuffer: Buffer, offset: number) {
		this.readBuffer = existingBuffer;
		this.bufferReadOffset = offset || 0;
	}

	buffer(length: number) {
		let buffer = this.readBuffer.slice(this.bufferReadOffset, this.bufferReadOffset + length);
		this.bufferReadOffset += length;

		return buffer;
	}

	skip() {
		this.bufferReadOffset += 1;
	}

	lookup() {
		let value = this.readBuffer[this.bufferReadOffset];

		if (!value) {
			throw new Error('Unexpected end of stream');
		}

		return value;
	}

	number(bit: NumberTypes): number {
		let value: number;

		switch (bit) {
			case 'u8':
				value = this.readBuffer.readUInt8(this.bufferReadOffset);
				this.bufferReadOffset += 1;
				break;
			case 'u16':
				value = this.readBuffer.readUInt16BE(this.bufferReadOffset);
				this.bufferReadOffset += 2;
				break;
			case 'u32':
				value = this.readBuffer.readUInt32BE(this.bufferReadOffset);
				this.bufferReadOffset += 4;
				break;
			case 'double':
				value = this.readBuffer.readDoubleBE(this.bufferReadOffset);
				this.bufferReadOffset += 8;
				break;
			default:
				throw new Error('Unknown number type');
		}

		return value;
	}

	size() {
		const lookup = this.lookup();

		if (!(lookup & 0x80)) {
			return this.number(NumberTypesEnum.u8);
		}

		if (!(lookup & 0x40)) {
			return this.number(NumberTypesEnum.u16) & 0x3FFF;
		}

		if (!(lookup & 0x20)) {
			return this.number(NumberTypesEnum.u32) & 0x1FFFFFFF;
		}

		throw new Error(`Invalid size encountered: ${lookup}`);
	}

	string(length): string {
		const buff = this.readBuffer.slice(this.bufferReadOffset, this.bufferReadOffset + length);
		this.bufferReadOffset += length;

		return buff.toString('binary');
	}
}
