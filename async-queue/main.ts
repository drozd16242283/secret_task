import { Mutex } from './mutex';
import { AsyncQueue } from './asyncQueue';

const task = async <T>(value: T): Promise<void> => {
	await new Promise((r) => setTimeout(r, 100 * Math.random()));
	console.log(value);
};

const main = async () => {
	const asyncQueue = new AsyncQueue(new Mutex());

	console.log('Sync Result', await Promise.all([
		asyncQueue.add(() => task(1)),
		asyncQueue.add(() => task(2)),
		asyncQueue.add(() => task(3)),
		asyncQueue.add(() => task(4)),
	]));
};

main();