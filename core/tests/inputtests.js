import {ColorLog, describe, it, expect} from './../testutility.js';
import Input from './../input.js';



export function TestInput()
{
	ColorLog("---------------- Testing Input System ----------------", "info");
	
	testSimpleInput();
	testPendingInput();
}


function testSimpleInput()
{
	Input.ClearState();
	describe("Confirm simple key state queries work", () =>
	{
		it("Key not held when nothing pressed", () => expect(Input.GetKey("KeyD")).toBe(false));
		it("Key not down when nothing pressed", () => expect(Input.GetKeyDown("KeyD")).toBe(false));
		it("Key not up when nothing pressed", () => expect(Input.GetKeyUp("KeyD")).toBe(false));
		
		Input.InjectKeyDown("KeyD");
		it("Key held when pressed", () => expect(Input.GetKey("KeyD")).toBe(true));
		it("Key down when pressed", () => expect(Input.GetKeyDown("KeyD")).toBe(true));
		it("Key not up when pressed", () => expect(Input.GetKeyUp("KeyD")).toBe(false));
		
		Input.InjectKeyUp("KeyD");
		it("Key still held after release but before update", () => expect(Input.GetKey("KeyD")).toBe(true));
		it("Key still down after release but before update", () => expect(Input.GetKeyDown("KeyD")).toBe(true));
		it("Key up when released", () => expect(Input.GetKeyUp("KeyD")).toBe(true));
		
		Input.BeginInputBlock();
		Input.EndInputBlock();
		it("Key no longer held after update", () => expect(Input.GetKey("KeyD")).toBe(false));
		it("Key no longer down after update", () => expect(Input.GetKeyDown("KeyD")).toBe(false));
		it("Key no longer up after update", () => expect(Input.GetKeyUp("KeyD")).toBe(false));
		
		Input.InjectKeyDown("KeyD");
		it("Key held when pressed next frame", () => expect(Input.GetKey("KeyD")).toBe(true));
		it("Key down when pressed next frame", () => expect(Input.GetKeyDown("KeyD")).toBe(true));
		it("Key not up when pressed next frame", () => expect(Input.GetKeyUp("KeyD")).toBe(false));
		
		Input.InjectKeyDown("KeyD");
		it("Key held when pressed again", () => expect(Input.GetKey("KeyD")).toBe(true));
		it("Key down when pressed again", () => expect(Input.GetKeyDown("KeyD")).toBe(true));
		it("Key not up when pressed again", () => expect(Input.GetKeyUp("KeyD")).toBe(false));
		
		Input.InjectKeyUp("KeyD");
		Input.BeginInputBlock();
		Input.EndInputBlock();
		it("Key no longer held after update", () => expect(Input.GetKey("KeyD")).toBe(false));
		it("Key no longer down after update", () => expect(Input.GetKeyDown("KeyD")).toBe(false));
		it("Key no longer up after update", () => expect(Input.GetKeyUp("KeyD")).toBe(false));
	});
}

function testPendingInput()
{
	Input.ClearState();
	describe("Confirms input that is received during the blocking phase is buffered and used next frame", () =>
	{
		//test input that occurs during 'blocking phase' where state is not allowed to update
		Input.BeginInputBlock();
		Input.InjectKeyDown("KeyF");
		it("Key not held when pressed during blocking phase", () => expect(Input.GetKey("KeyF")).toBe(false));
		it("Key not down when pressed during blocking phase", () => expect(Input.GetKeyDown("KeyF")).toBe(false));
		it("Key not up when pressed during blocking phase", () => expect(Input.GetKeyUp("KeyF")).toBe(false));
		
		//test transfer of pending states to current states
		Input.EndInputBlock();
		it("Key now held when after blocking phase", () => expect(Input.GetKey("KeyF")).toBe(true));
		it("Key now down after blocking phase", () => expect(Input.GetKeyDown("KeyF")).toBe(true));
		it("Key still not up after blocking phase", () => expect(Input.GetKeyUp("KeyF")).toBe(false));
		
		Input.InjectKeyUp("KeyF");
		it("Key still held after release but before update", () => expect(Input.GetKey("KeyF")).toBe(true));
		it("Key still down after release but before update", () => expect(Input.GetKeyDown("KeyF")).toBe(true));
		it("Key now up after release and before update", () => expect(Input.GetKeyUp("KeyF")).toBe(true));
		
		//confirm that previous frame's pending states were flushed
		Input.BeginInputBlock();
		Input.EndInputBlock();
		it("Key not held after update", () => expect(Input.GetKey("KeyF")).toBe(false));
		it("Key not down after update", () => expect(Input.GetKeyDown("keyF")).toBe(false));
		it("Key not up after update", () => expect(Input.GetKeyUp("KeyF")).toBe(false));
	});
	
	describe("Confirms pending states are properly handles on susiquent frames", () =>
	{
		Input.ClearState();
		
		Input.BeginInputBlock();
		Input.InjectKeyDown("KeyG");
		Input.InjectKeyUp("KeyG");
		it("Key not held during block phase", () => expect(Input.GetKey("KeyG")).toBe(false));
		it("Key not down during block phase", () => expect(Input.GetKeyDown("KeyG")).toBe(false));
		it("Key not up during block phase", () => expect(Input.GetKeyUp("KeyG")).toBe(false));
		
		Input.EndInputBlock();
		it("Key held after block phase", () => expect(Input.GetKey("KeyG")).toBe(true));
		it("Key down after block phase", () => expect(Input.GetKeyDown("KeyG")).toBe(true));
		it("Key up after block phase", () => expect(Input.GetKeyUp("KeyG")).toBe(true));
		
		Input.BeginInputBlock();
		Input.EndInputBlock();
		it("Key not held after next frame", () => expect(Input.GetKey("KeyG")).toBe(false));
		it("Key not down after next frame", () => expect(Input.GetKeyDown("KeyG")).toBe(false));
		it("Key not up after next frame", () => expect(Input.GetKeyUp("KeyG")).toBe(false));
	});
	
	describe("Confirms error if mismatched block phases are used", () =>
	{
		let error = false;
		try { Input.EndInputBlock(); }
		catch(e) {error = true;}
		it("Error should be thrown if ending before beginning", () => expect(error).toBe(true));
		
		error = false;
		try 
		{
			Input.BeginInputBlock();
			Input.BeginInputBlock();			
		}
		catch(e) {error = true;}
		it("Error should be thrown if beginning twice", () => expect(error).toBe(true));
	});
	
	//TODO: test for mis-matched keydown/keyup events
}



