import BufferSerializer from './buffer-serializer';
import { BufferSchema } from './type';

const userSchema: BufferSchema = {
	id: 'string',
	age: 'u32',
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
	favorites: [1, 2, 3],
	debt: -3150,
	performanceCoefficient: 1.5,
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