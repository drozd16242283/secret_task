import BufferSerializer from './buffer-serializer';
import { BufferSchema } from './type';

const userSchema: BufferSchema = {
	id: 'string',
	age: 'u32',
	performanceCoefficient: 'double',
	uniqueDocuments: 'Set',
	address: 'Map',
	testMap: 'Map',
	posts: {
		id: 'string',
		text: 'string',
		createAt: 'date',
		draft: 'bool'
	}
};

const serializer = new BufferSerializer(userSchema);

const buffer = serializer.toBuffer({
	id: 'u1',
	age: 30,
	performanceCoefficient: 1.5,
	uniqueDocuments: new Set([ 1, 2, 2, 3, 3, 2, 4, 5, 5, 2, 1 ]),
	address: new Map()
	.set('country', 'UA')
	.set('city', 'Lviv')
	.set('street', 'st. Gorodotska 1a'),
	testMap: new Map()
	.set({ nested: true }, 'nested Property') // Test for Map key as object
	.set(new Date(), 'date'), // Test for Map key as date,
	posts: [
		{
			id: 'p1',
			text: 'post1',
			createAt: new Date(),
			draft: true
		},
		{
			id: 'p2',
			text: 'post2',
			createAt: new Date(),
			draft: false
		},
	]
});

console.log('buffer', buffer);
console.log('from buff', serializer.fromBuffer(buffer));