#!/usr/bin/env node

/**
 * Simple WebSocket test client for TeleClone server
 * Usage: node test-client.js <phone_number>
 * 
 * Example:
 *   node test-client.js +1234567890
 */

const WebSocket = require('ws');

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:8080/ws';
const phoneNumber = process.argv[2] || '+1234567890';

console.log(`Connecting to ${SERVER_URL}...`);
console.log(`Phone number: ${phoneNumber}`);

const ws = new WebSocket(SERVER_URL);

let authenticated = false;
let userId = null;

ws.on('open', () => {
  console.log('✅ Connected to server');
  
  // Authenticate with dev OTP
  console.log('🔐 Authenticating...');
  ws.send(JSON.stringify({
    type: 'auth',
    payload: {
      phone_number: phoneNumber,
      otp: '123456' // Dev OTP
    }
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('\n📨 Received:', JSON.stringify(message, null, 2));

    if (message.type === 'authenticated') {
      authenticated = true;
      userId = message.data?.user_id;
      console.log(`✅ Authenticated! User ID: ${userId}`);
      console.log('\n💡 You can now send messages. Example:');
      console.log('   Send to user: {"type":"message","payload":{"to":"user_+9876543210_123","text":"Hello!"}}');
      console.log('\n📝 Waiting for messages...\n');
    } else if (message.type === 'message') {
      const msg = message.payload || message.data;
      console.log(`\n💬 New message from ${msg.from}:`);
      console.log(`   "${msg.text}"`);
      console.log(`   Time: ${new Date(msg.ts || msg.timestamp).toLocaleString()}\n`);
    } else if (message.type === 'error') {
      console.error(`❌ Error: ${message.error || message.data?.error}`);
    } else if (message.type === 'message_sent') {
      console.log('✅ Message sent successfully');
    }
  } catch (err) {
    console.error('Error parsing message:', err);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('\n👋 Disconnected from server');
  process.exit(0);
});

// Handle stdin for interactive mode
if (process.stdin.isTTY) {
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    const input = chunk.toString().trim();
    if (!input) return;

    if (!authenticated) {
      console.log('⏳ Please wait for authentication...');
      return;
    }

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(input);
      ws.send(JSON.stringify(parsed));
    } catch {
      // If not JSON, treat as simple message
      // You'll need to specify recipient: {"type":"message","payload":{"to":"<user_id>","text":"..."}}
      console.log('💡 To send a message, use JSON format:');
      console.log('   {"type":"message","payload":{"to":"<user_id>","text":"your message"}}');
    }
  });

  console.log('\n💡 Type JSON messages to send, or Ctrl+C to exit\n');
}

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n👋 Closing connection...');
  ws.close();
});
