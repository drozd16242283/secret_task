import { Mutex } from './mutex';

export class AsyncQueue {
	constructor(private readonly mutexInstance: Mutex) {}

	async add(func: () => Promise<void>) {
		const unlock = await this.mutexInstance.lock();
		await func();
		await unlock();
	}
}
