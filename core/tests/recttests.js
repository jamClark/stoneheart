import {ColorLog, describe, it, expect} from './../testutility.js';
import Rect from './../rect.js';


export function TestRect(canvas)
{
	return new Promise((resolve) =>
	{
		ColorLog("---------------- Testing Rect ----------------", "info");
		testConstructor();
		testOperations();
		resolve();
	});
}

function testConstructor()
{
	describe("Ensure constructor creates Rect with the appropriate initial values", () =>
	{
		let fpRect = new Rect(52, 23, 100, 20);
		it("Four-param constructor gives correct x-pos", () => expect(fpRect.Center.x).toBe(52));
		it("Four-param constructor gives correct y-pos", () => expect(fpRect.Center.y).toBe(23));
		it("Four-param constructor gives correct width", () => expect(fpRect.Width).toBe(100));
		it("Four-param constructor gives correct height", () => expect(fpRect.Height).toBe(20));
		
		it("Four-param constructor gives correct top", () => expect(fpRect.Top).toBe(33));
		it("Four-param constructor gives correct left", () => expect(fpRect.Left).toBe(2));
		it("Four-param constructor gives correct bottom", () => expect(fpRect.Bottom).toBe(13));
		it("Four-param constructor gives correct right", () => expect(fpRect.Right).toBe(102));
	});
	
	describe("Ensure constructor with Rect param creates a Rect with appropriate initial values", () =>
	{
		let fpRect = new Rect(52, 23, 100, 20);
		let rRect = new Rect(fpRect);
		it("Rect-param constructor gives correct x-pos", () => expect(rRect.Center.x).toBe(52));
		it("Rect-param constructor gives correct y-pos", () => expect(rRect.Center.y).toBe(23));
		it("Rect-param constructor gives correct width", () => expect(rRect.Width).toBe(100));
		it("Rect-param constructor gives correct height", () => expect(rRect.Height).toBe(20));
		
		it("Rect-param constructor gives correct top", () => expect(rRect.Top).toBe(33));
		it("Rect-param constructor gives correct left", () => expect(rRect.Left).toBe(2));
		it("Rect-param constructor gives correct bottom", () => expect(rRect.Bottom).toBe(13));
		it("Rect-param constructor gives correct right", () => expect(rRect.Right).toBe(102));
	});
}

function testOperations()
{
}

