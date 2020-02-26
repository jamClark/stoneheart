import {ColorLog, describe, it, expect} from './../testutility.js';
import MessageDispatch from './../messagedispatch.js';


export function TestMessageDispatch(canvas)
{
	return new Promise((resolve) =>
	{
		ColorLog("---------------- Testing Message Dispatch ----------------", "info");
		testDispatcher();
		resolve();
	});
}

function testDispatcher()
{
	describe("Test adding non-bound listener and posting messages", () =>
	{
		let msgId1 = "msg1";
		let msgId2 = "msg2";
		let disp = new MessageDispatch();
		
		let value1 = 0;
		let handler1 = function(param1)
		{
			value1 = param1;
		}
		
		let value2 = 0;
		let handler2 = function(param1)
		{
			value2 = param1;
		}
		
		disp.AddListener(msgId1, handler1);
		disp.PostMessage(msgId1, 10);
		it("Value in message handler was set through a posted message.", () => expect(value1).toBe(10));
		
		disp.RemoveListener(msgId1, handler1);
		disp.PostMessage(msgId1, 11);
		it("Value remains the same after listener is removed and message is reposted.", () => expect(value1).toBe(10));
		
		disp.AddListener(msgId1, handler1);
		disp.AddListener(msgId1, handler2);
		disp.PostMessage(msgId1, 45);
		it("Value on first handler is set correctly.", () => expect(value1).toBe(45));
		it("Value on second handler is set correctly.", () => expect(value2).toBe(45));
		
		disp.RemoveListener(msgId1, handler1);
		disp.PostMessage(msgId1, 100);
		it("Removing listener1 works properly.", () => expect(value1).toBe(45));
		it("Removing handler1 has no effect on listener2", () => expect(value2).toBe(100));
		
		disp.RemoveListener(msgId1, handler1);
		disp.PostMessage(msgId1, 6);
		it("Removing listener twice causes no issues.", () => expect(value2).toBe(6));
		
		disp.RemoveListener("someotherid", handler1);
		disp.PostMessage(msgId1, 17);
		it("Removing a listener that doesn't exist has no effect on listeners.", () => expect(value2).toBe(17));
		
		let obj1 = {
			value: 55,
			Handler: function(param)
			{
				this.value = param;
			}
		};
		disp.AddListener(msgId1, obj1.Handler, obj1);
		disp.PostMessage(msgId1, 147);
		it("An object-bound listener has it's 'this' property set correctly.", () => expect(obj1.value).toBe(147));
		
		disp.AddListener(msgId2, handler1);
		disp.PostMessage(msgId2, 1000);
		it("MsgId1 handler is not invoked when message is posted to MsgId2.", () => expect(value2).toBe(147));
		it("MsgId2 handler *is* invoked when message is posted to MsgId2.", () => expect(value1).toBe(1000));
		
		disp.RemoveListener(msgId2, handler2);
		disp.PostMessage(msgId2, 65);
		it("MsgId2 handler is not affected by removing MsgId1 handler.", () => expect(value1).toBe(65));
		
		disp.RemoveListener(msgId2, obj1.Handler);
		disp.PostMessage(msgId2, 627);
		it("MsgId2 handler is not affected if we attempt to remove the incorrect handler.", () => expect(value1).toBe(627));
		
		disp.PostMessage(msgId1, 87);
		it("MsgId1 handler is not affected if we attempt to remove it using the wrong msg id.", () => expect(obj1.value).toBe(87));
	});
}

