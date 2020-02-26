import {ColorLog, describe, it, expect} from './../../core/testutility.js';
import Entity from './../entity.js';
import BaseComponent from './../basecomponent.js';
import BaseComponentSystem from './../basecomponentsystem.js';
import EntityManager from './../entitymanager.js';
import SystemsManager from './../systemsmanager.js';
import EntityMessage from './../entitymessage.js';


export function TestECS(canvass)
{
	ColorLog("---------------- Testing ECS ----------------", "info");
	testEntity();
	testBasicQuery();
	testDynamicComposition();
	testComponentQuery();
	testComponentSystem();
	testMessageDispatch();
}

class MockCompZero extends BaseComponent
{
}

class MockCompOne extends BaseComponent
{
}

class MockCompTwo extends BaseComponent
{
}

class MockCompThree extends BaseComponent
{
}

function testEntity()
{
	describe("Entity has correct basic propeties", () => 
	{
		let ent = new Entity("Mr. Ent");
		it("Name is 'Mr. Entity'", () => { expect(ent.name).toBe("Mr. Ent"); })
		it("Does not claim to have any components", ()=> { expect(ent.HasComponents(MockCompOne)).toBe(false); })
	});
}

function testBasicQuery()
{
	describe("Basic component querying works", () =>
	{
		let m = new MockCompOne();
		let ent = new Entity("Mr Ent", m);
		
		it("HasComponents returns true for MockCompOne", () => { expect(ent.HasComponents(MockCompOne)).toBe(true); });
		it("HasComponents is false for MockComponentTwo", () => { expect(ent.HasComponents(MockCompTwo)).toBe(false); });
		it("HasComponents is false for both", () => { expect(ent.HasComponents(MockCompOne, MockCompTwo)).toBe(false); });
		it("HasComponents is false for both reversed", () => { expect(ent.HasComponents(MockCompTwo, MockCompOne)).toBe(false); });
		it("GetComponent returns correct component when found", () => expect(m == ent.GetComponent(MockCompOne)).toBe(true));
		it("GetComponent returns null when not found", () => expect(null == ent.GetComponent(MockCompTwo)).toBe(true));
	});
}

function testDynamicComposition()
{
	describe("Addition and removal of components works", () =>
	{
		let ent = new Entity("Mr Ent");
		
		it("First component not yet present", () => {expect(ent.HasComponents(MockCompOne)).toBe(false); });
		let comp1 = ent.AddComponent(new MockCompOne());
		it("Adding first component works", () => { expect(ent.HasComponents(MockCompOne)).toBe(true); });
		it("Second component is not present", () => { expect(ent.HasComponents(MockCompTwo)).toBe(false); });
		
		let comp2 = ent.AddComponent(new MockCompTwo());
		it("Adding a second component works", () => { expect(ent.HasComponents(MockCompTwo)).toBe(true); });
		it("First component still present", () => {expect(ent.HasComponents(MockCompOne)).toBe(true); });
		
		ent.RemoveComponent(comp1);
		it("Removal of first component works", () => { expect(ent.HasComponents(MockCompOne)).toBe(false); });
		it("Second comp still present", () => { expect(ent.HasComponents(MockCompTwo)).toBe(true); });
		
		ent.RemoveComponent(comp2);
		it("Removal of second component works", () => { expect(ent.HasComponents(MockCompTwo)).toBe(false); });
		
		ent.AddComponent(comp1);
		ent.AddComponent(comp2);
		it("Both components present again, reversed query", () => { expect(ent.HasComponents(MockCompTwo, MockCompOne)).toBe(true); });
		it("Both components present normal query", () => { expect(ent.HasComponents(MockCompOne, MockCompTwo)).toBe(true); });
		
		ent.RemoveComponent(comp2);
		it("Removal of second component works", () => { expect(ent.HasComponents(MockCompTwo)).toBe(false); });
		it("First component still present", () => { expect(ent.HasComponents(MockCompOne)).toBe(true); });
	});
}

function testComponentQuery()
{
	describe("Confirms component querying system works", () =>
	{
		let m1 = new MockCompOne();
		let m2 = new MockCompTwo();
		let m3 = new MockCompThree();
		let ent = new Entity("Mr Ent", m1, m2, m3);
		
		it("Confirm all components are present", () => { expect(ent.HasComponents(MockCompOne, MockCompTwo, MockCompThree)).toBe(true); });
		
		it("Confirm query for missing comp return null", () => { expect(ent.QueryForComponents(MockCompZero)).toBe(null); });
		it("Confirm query for partially present comp list returns null", () => { expect(ent.QueryForComponents(MockCompZero, MockCompOne)).toBe(null); });
		let r = ent.QueryForComponents(MockCompOne);
		it("Query result is not null", () => { expect(r).toNotBe(null); });
		it("Query result is no undefined", () => { expect(r).toNotBe(undefined); });
		it("Query result is an array", () => { expect(Array.isArray(r)).toBe(true); });
		
		
		it("Query comp is not null", () => { expect(r).toNotBe(null); });
		it("Comp from query is same object that was added", () => { expect(r[0] == m1).toBe(true); });
		it("Comp result is of type MockCompOne", () => { expect (r[0] instanceof MockCompOne).toBe(true); });
		
		r = ent.QueryForComponents(MockCompOne, MockCompTwo);
		it("Query for comp one and two returns list of correct size", () => { expect(r.length).toBe(2); });
		it("Query result 0 is of type MockCompOne", () => { expect(r[0] instanceof MockCompOne).toBe(true); });
		it("Query result 1 is of type MockCompTwo", () => { expect(r[1] instanceof MockCompTwo).toBe(true); });
		
		r = ent.QueryForComponents(MockCompOne, MockCompThree);
		it("Query for comp one and three has correct type for 0", () => { expect(r[0] instanceof MockCompOne).toBe(true); });
		it("Query for comp one and three has correct type for 1", () => { expect(r[1] instanceof MockCompThree).toBe(true); });
		
		//this also tests for queries that are not the same length as total as well as out-of-order queries
		r = ent.QueryForComponents(MockCompThree, MockCompOne);
		it("Reverse query has correct type for result 0", () => { expect(r[0] instanceof MockCompThree).toBe(true); });
		it("Reverse query has correct type for result 1", () => { expect(r[1] instanceof MockCompOne).toBe(true); });
		
		r = ent.QueryForComponents(MockCompOne, MockCompThree, MockCompTwo);
		it("Triple query has correct length", () => { expect(r.length).toBe(3); });
		it("Triple query has correct type for result 0", () => { expect(r[0] instanceof MockCompOne).toBe(true); });
		it("Triple query has correct type for result 1", () => { expect(r[1] instanceof MockCompThree).toBe(true); });
		it("Triple query has correct type for result 2", () => { expect(r[2] instanceof MockCompTwo).toBe(true); });
		
		ent.RemoveComponent(r[2]); //remove MockCompTwo
		r = ent.QueryForComponents(MockCompOne, MockCompThree);
		it("Query after removal has correct result for 0", () => { expect(r[0] instanceof MockCompOne).toBe(true); });
		it("Query after removal has correct result for 1", () => { expect(r[1] instanceof MockCompThree).toBe(true); });
		
		ent.RemoveComponent(m1);
		ent.AddComponent(m2);
		r = ent.QueryForComponents(MockCompTwo, MockCompThree);
		it("Query after removal and addition has correct result for 0", () => { expect(r[0] instanceof MockCompTwo).toBe(true); });
		it("Query after removal and addition has correct resukt for 1", () => { expect(r[1] instanceof MockCompThree).toBe(true); });
		
		r = ent.QueryForComponents(MockCompOne, MockCompThree);
		it("Invalid query after removal returns null", () => { expect(r).toBe(null); });
	});
}

class TestComp extends BaseComponent
{
	constructor(value)
	{
		super();
		this.Value = value;
	}
}

class TestCompSystem extends BaseComponentSystem
{
	constructor()
	{
		super(TestComp);
	}
	
	Process(entity, comp)
	{
		comp.Value++;
	}
}


function testComponentSystem()
{
	describe("Confirm properly defined and registered component system follows full pipeline", () =>
	{
		let ent = new Entity("Entity", new TestComp(45));
		let sys = new TestCompSystem();
		let c = ent.GetComponent(TestComp);
		it("Component start value is correct", () => expect(c.Value).toBe(45));
		
		let entMan = new EntityManager();
		let sysMan = new SystemsManager(entMan);
		entMan.RegisterEntity(ent);
		sysMan.RegisterSystem(sys);
		sysMan.Update();
		it("Component value has been modified with update", () => expect(c.Value).toBe(46));
	});
}


class TestMessage1 extends EntityMessage
{
	constructor(value)
	{
		super();
		this.Value = value;
	}
}

class TestMessage2 extends EntityMessage
{
	constructor(value)
	{
		super();
		this.Value = value;
	}
}

class HandlerComp1 extends BaseComponent
{
	constructor(startValue)
	{
		super();
		this.Value = startValue;
	}
	
	HandleMessage(sender, msg)
	{
		this.Value = msg.Value;
	}
}

class HandlerComp2 extends BaseComponent
{
	constructor(startValue)
	{
		super();
		this.Value = startValue;
	}
	
	HandleMessage(sender, msg)
	{
		this.Value = msg.Value;
	}
}

function testMessageDispatch()
{
	describe("Test message registration and direct dispatch to single entity", () =>
	{
		let comp = new HandlerComp1(15);
		let ent = new Entity(comp);
		let man = new EntityManager();
		man.RegisterEntity(ent);
		
		it("Confirm start value of message is as expected.", () => expect(comp.Value).toBe(15));
		
		ent.AddListener(TestMessage1, comp);
		ent.SendMessage(ent, new TestMessage1(21));
		it("Confirm that sending a local message changes component value as expected.", () => expect(comp.Value).toBe(21));
		
		ent.SendMessage(ent, new TestMessage1(23));
		it("Confirm that sending a local message changes component value as expected.", () => expect(comp.Value).toBe(23));
		
		ent.RemoveListener(TestMessage1, comp);
		ent.SendMessage(ent, new TestMessage1(500));
		it("Confirm that sending a local message after removing listener causes value to remain unchanged.", () => expect(comp.Value).toBe(23));
		
		ent.SendMessage(ent, new TestMessage2(100));
		it("Confirm posting message of a different type has no effect on registered message handler.", () => expect(comp.Value).toBe(23));
		
		ent.PostMessage(new TestMessage1(400));
		it("Confirm that global message has no effect on local listeners.", () => expect(comp.Value).toBe(23));
	});
	
	describe("Confirm globally posted messages can be registered to, send, and unregistered from.", () =>
	{
		let comp = new HandlerComp1(28);
		let ent = new Entity(comp);
		let man = new EntityManager();
		man.RegisterEntity(ent);
		it("Confirm start value of message is as expected.", () => expect(comp.Value).toBe(28));
		
		ent.AddGlobalListener(TestMessage1, comp);
		ent.SendMessage(ent, new TestMessage1(100));
		it("Confirm local message has no effect.", () => expect(comp.Value).toBe(28));
		
		ent.PostMessage(new TestMessage1(97));
		it("Confirm globally posted message is recived.", () => expect(comp.Value).toBe(97));
		
		ent.PostMessage(new TestMessage2(44));
		it("Confirm posting a different message globally has no effect.", () => expect(comp.Value).toBe(97));
		
		ent.RemoveGlobalListener(TestMessage1, comp);
		ent.PostMessage(new TestMessage1(104));
		it("Confirm removing handler no longer causes it to receive global messages.", () => expect(comp.Value).toBe(97));
		
	});
}
