import {ColorLog, describe, it, expect} from './../testutility.js';
import Vector2 from './../vector2.js';


export function TestVector2()
{
	return new Promise((resolve) =>
	{
		ColorLog("---------------- Testing Vector2 ----------------", "info");
		testConstructor();
		testOperations();
		resolve();
	});
}

function testConstructor()
{
	describe("Confirm constructor works", () => 
	{
		let v1 = new Vector2();
		it("Default constructor gives x = 0", () => expect(v1.x).toBe(0));
		it("Default constructor gives y = 0", () => expect(v1.x).toBe(0));
		
		let v2 = new Vector2(4);
		it("X value is passed in single-parameter constructor", () => expect(v2.x).toBe(4));
		
		let v3 = new Vector2(3, 7);
		it("X value is passed in X,Y constructor", () => expect(v3.x).toBe(3));
		it("Y value is passed in X,Y constructor", () => expect(v3.y).toBe(7));
		
		let v4 = new Vector2(v3);
		it("X value is correct in Vector2 copy-constructor", () => expect(v4.x).toBe(3));
		it("Y value is correct in Vector2 copy-constructor", () => expect(v4.y).toBe(7));
		it("Copy-constructor object is not the same object as it's Vector2 parameter", () => expect(v4 != v3).toBe(true));
	});
}

function testOperations()
{
	let v1 = new Vector2(3, 5);
	let v2 = new Vector2(7, 13);
	let s = 17;
	
	describe("Confirm Vector-Add operation", () => 
	{
		let r1 = v1.Add(v2);
		it("Addition operation does not modify source vector", () => expect(v1.x == 3 && v1.y == 5).toBe(true));
		it("Addition operation does not modify added vector", () => expect(v2.x == 7 && v2.y == 13).toBe(true));
		it("Result vector has correct values", () => expect(r1.x == 10 && r1.y == 18).toBe(true));
	});
	
	describe("Confirm Component-Add operation", () => 
	{
		let r1 = v1.Add(7, 13);
		it("Addition operation does not modify source vector", () => expect(v1.x == 3 && v1.y == 5).toBe(true));
		it("Result vector has correct values", () => expect(r1.x == 10 && r1.y == 18).toBe(true));
	});
	
	describe("Confirm Vector-Sum operation", () =>
	{
		let s1 = new Vector2(10, 45);
		let v2 = new Vector2(13, 11);
		s1.Sum(v2);
		it("Sum operation modifies the original vector properly", () => expect(s1.x == 23 && s1.y == 56).toBe(true));
	});
	
	describe("Confirm Component-Sum operation", () =>
	{
		let s1 = new Vector2(10, 45);
		s1.Sum(13, 11);
		it("Sum operation modifies the original vector properly", () => expect(s1.x == 23 && s1.y == 56).toBe(true));
	});
	
	describe("Confirm Vector-Sub operation", () => 
	{
		let r1 = v1.Sub(v2);
		it("Subtraction operation does not modify source vector", () => expect(v1.x == 3 && v1.y == 5).toBe(true));
		it("Subtraction operation does not modify added vector", () => expect(v2.x == 7 && v2.y == 13).toBe(true));
		it("Result vector has correct values", () => expect(r1.x == -4 && r1.y == -8).toBe(true));
	});
	
	describe("Confirm Component-Sub operation", () => 
	{
		let r1 = v1.Sub(7, 13);
		it("Subtraction operation does not modify source vector", () => expect(v1.x == 3 && v1.y == 5).toBe(true));
		it("Result vector has correct values", () => expect(r1.x == -4 && r1.y == -8).toBe(true));
	});
	
	describe("Confirm Vector-Mul operation", () => 
	{
		let r1 = v1.Mul(v2);
		it("Multiplcation operation does not modify source vector", () => expect(v1.x == 3 && v1.y == 5).toBe(true));
		it("Multiplcation operation does not modify added vector", () => expect(v2.x == 7 && v2.y == 13).toBe(true));
		it("Result vector has correct values", () => expect(r1.x == 21 && r1.y == 65).toBe(true));
	});
	
	describe("Confirm Component-Mul operation", () => 
	{
		let r1 = v1.Mul(7, 13);
		it("Multiplcation operation does not modify source vector", () => expect(v1.x == 3 && v1.y == 5).toBe(true));
		it("Result vector has correct values", () => expect(r1.x == 21 && r1.y == 65).toBe(true));
	});
	
	describe("Confirm Scalar-Mul operation", () => 
	{
		let r1 = v1.Mul(13);
		it("Multiplcation operation does not modify source vector", () => expect(v1.x == 3 && v1.y == 5).toBe(true));
		it("Result vector has correct values", () => expect(r1.x == 39 && r1.y == 65).toBe(true));
	});
	
	describe("Confirm Vector-Scale operation", () =>
	{
		let s1 = new Vector2(10, 45);
		let v2 = new Vector2(13, 11);
		s1.Scale(v2);
		it("Scale operation modifies the original vector properly", () => expect(s1.x == 130 && s1.y == 495).toBe(true));
	});
	
	describe("Confirm Component-Scale operation", () =>
	{
		let s1 = new Vector2(10, 45);
		s1.Scale(13, 11);
		it("Scale operation modifies the original vector properly", () => expect(s1.x == 130 && s1.y == 495).toBe(true));
	});
	
	describe("Confirm Scalar-Scale operation", () =>
	{
		let s1 = new Vector2(10, 45);
		s1.Scale(7);
		it("Scale operation modifies the original vector properly", () => expect(s1.x == 70 && s1.y == 315).toBe(true));
	});
	
	describe("Confirm that normalization works", () =>
	{
		let failed = null;
		for(let i = 0; i < 100; i++)
		{
			let v = new Vector2(1000 - (Math.random() * 2000), 1000 - (Math.random() * 2000));
			let r = v.normalized;
			if(Math.abs(r.Mag - 1.0) >  0.0625)
			{
				failed = [i, new Vector2(v), r.Mag];
				break;
			}
		}
		it("Within epsilon of '0.0625' for a series of random vectors", () => expect(failed == null).toBe(true));
		if(failed != null)
			console.log("Normalization details: (" + failed[1].x + "," + failed[1].y + ")    ---> " + failed[2]); 
		
		let v1 = new Vector2(10, -390);
		let r1 = v1.normalized;
		it("Normal() doesn't modify the original vector", () => expect(v1.x == 10 && v1.y == -390).toBe(true));
		
		v1.Normalize();
		it("Normalize() does modify the original vector", () => expect(Math.abs( v1.Mag - 1.0) < 0.0625).toBe(true));
	});
}

