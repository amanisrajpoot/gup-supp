#!/bin/bash

# TeleClone API Test Client
# Usage: ./test_client.sh

BASE_URL="http://localhost:8080/api"

echo "=== TeleClone API Test Client ==="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Register
echo -e "${BLUE}Step 1: Registering user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "username": "testuser",
    "name": "Test User"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user_id')
OTP=$(echo "$REGISTER_RESPONSE" | jq -r '.otp')

echo -e "${GREEN}✓ Registered user: $USER_ID${NC}"
echo -e "${YELLOW}OTP: $OTP${NC}"
echo ""

# Step 2: Login
echo -e "${BLUE}Step 2: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"+1234567890\",
    \"otp\": \"$OTP\"
  }")

echo "$LOGIN_RESPONSE" | jq '.'
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

echo -e "${GREEN}✓ Logged in, token: ${TOKEN:0:20}...${NC}"
echo ""

# Step 3: Get Chats (should be empty)
echo -e "${BLUE}Step 3: Getting chats...${NC}"
CHATS_RESPONSE=$(curl -s "$BASE_URL/chats" \
  -H "Authorization: Bearer $TOKEN")
echo "$CHATS_RESPONSE" | jq '.'
echo ""

# Step 4: Create Group
echo -e "${BLUE}Step 4: Creating group...${NC}"
GROUP_RESPONSE=$(curl -s -X POST "$BASE_URL/groups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Group",
    "participants": []
  }')

echo "$GROUP_RESPONSE" | jq '.'
CHAT_ID=$(echo "$GROUP_RESPONSE" | jq -r '.id')

echo -e "${GREEN}✓ Created group: $CHAT_ID${NC}"
echo ""

# Step 5: Send Message
echo -e "${BLUE}Step 5: Sending message...${NC}"
MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"chat_id\": \"$CHAT_ID\",
    \"content\": \"Hello, TeleClone!\",
    \"type\": \"text\"
  }")

echo "$MESSAGE_RESPONSE" | jq '.'
MESSAGE_ID=$(echo "$MESSAGE_RESPONSE" | jq -r '.id')

echo -e "${GREEN}✓ Sent message: $MESSAGE_ID${NC}"
echo ""

# Step 6: Get Messages
echo -e "${BLUE}Step 6: Getting messages...${NC}"
MESSAGES_RESPONSE=$(curl -s "$BASE_URL/messages/$CHAT_ID?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN")
echo "$MESSAGES_RESPONSE" | jq '.'
echo ""

# Step 7: Edit Message
echo -e "${BLUE}Step 7: Editing message...${NC}"
EDIT_RESPONSE=$(curl -s -X PUT "$BASE_URL/messages/edit/$MESSAGE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Hello, TeleClone! (edited)"
  }')

echo "$EDIT_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Message edited${NC}"
echo ""

# Step 8: Search Messages
echo -e "${BLUE}Step 8: Searching messages...${NC}"
SEARCH_RESPONSE=$(curl -s "$BASE_URL/search?q=Hello&chat_id=$CHAT_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "$SEARCH_RESPONSE" | jq '.'
echo ""

echo -e "${GREEN}=== All tests completed! ===${NC}"
