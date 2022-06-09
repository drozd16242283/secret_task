type MySourceType = {
	field1: string;
	field2: number;
	field3: number[];
	field4: Date;
	field5: {
		nestedField1: number;
		nestedField2: number[];
		nestedField3: Date;
	};
};

type Literal = { [k: string]: {} };

type mapToBool<T> = T extends Array<{}>
	? Array<boolean>
	: T extends Literal
		? { [Property in keyof T]: mapToBool<T[Property]> }
		: boolean;


type SelectedBoolean = mapToBool<MySourceType>;
