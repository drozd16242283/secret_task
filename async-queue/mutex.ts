export class Mutex {
	current = Promise.resolve();

	lock() {
		let _resolve;
		const promise = new Promise<void>(resolve => {
			_resolve = () => resolve();
		});

		const unlock = this.current.then(() => _resolve);

		this.current = promise;

		return unlock;
	}
}
