process.env.RABBITMQ_PORT = '1111';
process.env.RABBITMQ_USER = 'user';
process.env.RABBITMQ_PASSWORD = 'password';

type ConfigValues = {
	value: unknown,
	mod: MODE,
	validate?: string;
}

type ConfigDataType = { [key: string]: ConfigValues }

enum MODE {
	LOCK,
	READ,
	WRITE
}

export class Config {
	[key: string]: unknown | { (configData: ConfigDataType): void };

	constructor(config: ConfigDataType) {
		this.parse(config);
	}

	parse(configData: ConfigDataType): void {
		Object.keys(configData).forEach((key) => {
			const value = process.env[key] || configData[key].value;
			Object.assign(this, {
				[key]: value,
			});

			if (configData[key] && configData[key].mod === MODE.LOCK) {
				Object.defineProperty(this, key, { configurable: false, writable: false });
			}

			if (configData[key] && configData[key].mod === MODE.READ) {
				Object.defineProperty(this, key, {
					get: () => value,
					set: () => { throw new Error('ONLY READ MODE') }
				});
			}
		});
	}
}

export const RABBITMQ = {
	RABBITMQ_HOST: {
		value: 'localhost', //
		mod: MODE.READ | MODE.WRITE, //
		validate: '', //
	},
	RABBITMQ_PORT: {
		value: undefined as unknown as number,
		mod: MODE.READ,
	},
	RABBITMQ_USER: {
		value: undefined as unknown as string,
		mod: MODE.WRITE,
	},
	RABBITMQ_PASSWORD: {
		value: undefined as unknown as string,
		mod: MODE.LOCK,
	},
};

const config = new Config(RABBITMQ);

console.log('host (default)', config.RABBITMQ_HOST); // default value = localhost
console.log('port', config.RABBITMQ_PORT);

// MODE = WRITE
console.log('user', config.RABBITMQ_USER);
config.RABBITMQ_USER = 'new-user';
console.log('changed-user', config.RABBITMQ_USER); // new-user

// MODE = LOCK
console.log('config', config.RABBITMQ_PASSWORD);
try {
	config.RABBITMQ_PASSWORD = 'pass'; // ERROR
} catch (error) {
	console.error(error.toString());
}
