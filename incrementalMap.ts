class IncrementalMap {
	currentSnapshotKey = 0;
	map = new Map();

	get(key) {
		const historyKey = `${this.currentSnapshotKey}:${key}`;
		return this.map.get(historyKey);
	}

	set(key, value) {
		const historyKey = `${this.currentSnapshotKey}:${key}`;
		this.map.set(historyKey, value);
	}

	snapshot(key: number) {
		this.currentSnapshotKey = key;
	}
}

const map = new IncrementalMap();

map.snapshot(0);
map.set('name', 'John');
map.set('salary', 10);

console.log('Snapshot 1 - Name', map.get('name'));
console.log('Snapshot 1 - Salary', map.get('salary'));

map.snapshot(1);
map.set('salary', 50);
map.set('age', 25);

console.log('Snapshot 2 - Name', map.get('name')); // Doesn't has a property that not changed
console.log('Snapshot 2 - Salary', map.get('salary'));
console.log('Snapshot 2 - Age', map.get('age'));

map.snapshot(0);

console.log('Snapshot 1 - Name', map.get('name'));
console.log('Snapshot 1 - Salary', map.get('salary'));