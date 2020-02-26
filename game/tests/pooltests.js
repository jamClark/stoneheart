import {ColorLog, describe, it, expect} from './../../core/testutility.js';
import Lazarus from './../pool.js';


export function TestPool()
{
	return new Promise((resolve) =>
	{
		ColorLog("---------------- Testing Pool ----------------", "info");
		testConstructor();
		testDraining();
		testMultiplePools();
		testPooledObjectCallbacks();
		resolve();
	});
}


/// 
/// 
/// 
function testConstructor()
{
	return new Promise((resolve) =>
	{
		let FactoryInvokeCount = 0;
		function Factory(name, value)
		{
			FactoryInvokeCount++;
			return {
				name: name,
				value: value,
			};
		}
		describe("Confirm pool defining works", () => 
		{
			Lazarus.Reset();
			let chunk = 8;
			let max = chunk * 2;
			
			let pool = Lazarus.Define("testpool", chunk, max, Factory, "Name1", 15);
			it("Defined pool is not null", () => expect(pool != null).toBe(true));
			
			let obj1 = Lazarus.Summon("testpool");
			it("Summoned object is not null", () => expect(obj1 != null).toBe(true));
			it("Factory has been invoked 'chunk' ("+chunk+") times upon summoning an object", () => expect(FactoryInvokeCount).toBe(chunk));
			it("Name param passed to factory is correct", () => expect(obj1.name).toBe("Name1"));
			it("Value param passed to factory is correct", () => expect(obj1.value).toBe(15));
			it("The object returned has its internal pool set properly", () => expect(obj1._LazarusPool == pool).toBe(true));
		});
		
		resolve(true);
	});
}

/// 
/// 
/// 
function testDraining()
{
	return new Promise((resolve) =>
	{
		let FactoryInvokeCount = 0;
		function Factory(name, value)
		{
			FactoryInvokeCount++;
			return {
				name: name,
				value: value,
			};
		}
		describe("Pool pending/active count works", () =>
		{
			Lazarus.Reset();
			let chunk = 8;
			let max = chunk * 2;
			let pool = Lazarus.Define("testpool", chunk, max, Factory, "Name1", 15);
			let obj1 = Lazarus.Summon("testpool");
			it("The pool has 1 active item after first summon.", () => expect(pool.ActiveCount).toBe(1));
			it("The pool has 'chunk'-1 ("+(chunk-1)+") number of pending items after first summon.", () => expect(pool.PendingCount).toBe(chunk-1));
			it("The pool has 'chunk' ("+chunk+") total number of items after first summon.", () => expect(pool.TotalCount).toBe(chunk));
			
			let obj2 = Lazarus.Summon("testpool");
			it("The pool has 2 active items after second summon.", () => expect(pool.ActiveCount).toBe(2));
			it("The pool has 'chunk'-2 ("+(chunk-2)+") number of pending items after second summon.", () => expect(pool.PendingCount).toBe(chunk-2));
			it("The pool has 'chunk' ("+chunk+") total number of items after second summon.", () => expect(pool.TotalCount).toBe(chunk));
			
			let pool2 = Lazarus.Define("testpool2", chunk, max, Factory, "Name2", 25);
			it("Confirm new pool is not same as old pool.", () => expect(pool != pool2).toBe(true));
			it("Confirm new pool has zero pre-allocated values.", () => expect(pool2.TotalCount).toBe(0));
			it("Confirm old pool still has the same pending count.", () => expect(pool.PendingCount).toBe(chunk-2));
		
			Lazarus.Relenquish(obj1);
			it("Pending count is correctly raised after relenquishing.", () => expect(pool.PendingCount).toBe(chunk-1));
			it("Active count is correctly lowered after relenquishing.", () => expect(pool.ActiveCount).toBe(1));
			it("Second pool pending is not affected after relenquishing.", () => expect(pool2.PendingCount).toBe(0));
			
			Lazarus.Drain("testpool");
			it("Draining first pool resets pending count in it.", () => expect(pool.PendingCount).toBe(0));
			it("Draining first pool has no effect of already summoned count.", () => expect(pool.ActiveCount).toBe(1));
			it("Draining first pool has no effect on second pool.", () => expect(pool2.PendingCount).toBe(0));
			
			obj1 = Lazarus.Summon("testpool"); //need to get this back so our count is consistent
			it("Re-summoning twice keeps our pending count at chunk("+chunk+")-2", () => expect(pool.PendingCount).toBe(chunk-1));
			it("Re-summoning twice keeps our active count at 2 (since we never relenquished one before draining)", () => expect(pool.ActiveCount).toBe(2));
			Lazarus.ReclaimActive("testpool");
			Lazarus.Drain("testpool");
			it("Reclaim and drain will lower active to 0.", () => expect(pool.ActiveCount).toBe(0));
			it("Reclaim and drain will set pending to 0.", () => expect(pool.PendingCount).toBe(0));
			
			obj1 = Lazarus.Summon("testpool");
			Lazarus.ReclaimActive("testpool");
			it("Reclaiming all active will lower active count to 0.", () => expect(pool.ActiveCount).toBe(0));
			it("Reclaiming all active will raise pending to next chunk size.", () => expect(pool.PendingCount).toBe(chunk));
			Lazarus.Drain("testpool");
			
			let summonCount = ((chunk*2) + 1);
			let diff = ((chunk*3) - summonCount);
			let objs = [];
			for(let i = 0; i < summonCount; i++)
				objs.push(Lazarus.Summon("testpool"));
			it("Summoning more than chunk size elements ("+summonCount+") will cause pool to grow by another chunk size ("+ (chunk*3) + ").", () => expect(pool.TotalCount).toBe(chunk*3));
			it("Active count is correct ("+summonCount+").", () => expect(pool.ActiveCount).toBe(summonCount));
			it("Pending count is correct ("+diff+").", () => expect(pool.PendingCount).toBe(diff));
			
			for(let i = 0; i < summonCount; i++)
				Lazarus.Relenquish(objs[i]);
			it("Relenquishing more than max allowed does not cause pending list to grow.", () => expect(pool.PendingCount).toBe(chunk*2));
			
		});
		
		resolve(true);
	});
}

/// 
/// 
/// 
function testMultiplePools()
{
	return new Promise((resolve) =>
	{
		let FactoryInvokeCount = 0;
		function Factory(name, value)
		{
			FactoryInvokeCount++;
			return {
				name: name,
				value: value,
			};
		}
		describe("Multiple pools are tracked correctly", () =>
		{
			Lazarus.Reset();
			let chunk = 8;
			let max = chunk * 2;
			let pool = Lazarus.Define("testpool", chunk, max, Factory, "Name1", 15);
			let obj1 = Lazarus.Summon("testpool");
			let obj2 = Lazarus.Summon("testpool");
			
			let pool2 = Lazarus.Define("testpool2", chunk, max, Factory, "Name2", 25);
			it("Confirm new pool is not same as old pool.", () => expect(pool != pool2).toBe(true));
			it("Confirm new pool has zero pre-allocated values.", () => expect(pool2.TotalCount).toBe(0));
			it("Confirm old pool still has the same pending count.", () => expect(pool.PendingCount).toBe(chunk-2));
		});
		
		resolve(true);
	});
}

/// 
/// 
/// 
function testPooledObjectCallbacks()
{
	return new Promise((resolve) =>
	{
		let FactoryInvokeCount = 0;
		function Factory(name, value)
		{
			FactoryInvokeCount++;
			return {
				name: name,
				value: value,
				OnRelenquishedToPool : function(pool)
				{
					this.Relequished = true;
					this.Summoned = false;
					this.AlreadyRelenquished = true;
				},
				OnSummonedFromPool: function(pool)
				{
					this.Summoned = true;
					this.AlreadyRelenquished = false;
				},
			};
		}
		describe("Multiple pools are tracked correctly", () =>
		{
			Lazarus.Reset();
			let chunk = 8;
			let max = chunk * 2;
			let pool = Lazarus.Define("testpool", chunk, max, Factory, "Name1", 15);
			
			let obj1 = Lazarus.Summon("testpool");
			it("Object had OnSummonedFromPool invoked when spawned.", () => expect(obj1.Summoned).toBe(true));
			it("Object did not have OnRelenquishedToPool invoked when spawned.", () => expect(obj1.Relenquished).toBe(undefined));
			
			Lazarus.Relenquish(obj1);
			it("Object had OnRelenquishedToPool invoked when relenquished.", () => expect(obj1.Relequished).toBe(true));
			it("Object did not have OnSummonedFromPool invoked when relenquished.", () => expect(obj1.AlreadyRelenquished).toBe(true));
			
			//TODO: What about when pools are drained?
		});
		
		resolve(true);
	});
}

