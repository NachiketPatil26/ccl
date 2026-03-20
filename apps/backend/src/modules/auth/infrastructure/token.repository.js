const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { env } = require('../../../config/env');

const memoryTokenStore = new Map();

const dynamoClient = new DynamoDBClient({
  region: env.awsRegion
});
const dynamoDocumentClient = DynamoDBDocumentClient.from(dynamoClient);

function isDynamoStoreEnabled() {
  return Boolean(env.tokenTableName);
}

async function getTokenRecordByUserId(userId) {
  if (!isDynamoStoreEnabled()) {
    return memoryTokenStore.get(userId) || null;
  }

  const response = await dynamoDocumentClient.send(
    new GetCommand({
      TableName: env.tokenTableName,
      Key: { userId }
    })
  );

  return response.Item || null;
}

async function saveTokenRecord(tokenRecord) {
  if (!isDynamoStoreEnabled()) {
    memoryTokenStore.set(tokenRecord.userId, tokenRecord);
    return;
  }

  await dynamoDocumentClient.send(
    new PutCommand({
      TableName: env.tokenTableName,
      Item: tokenRecord
    })
  );
}

async function saveTokensForUser(userId, tokens) {
  const existingRecord = await getTokenRecordByUserId(userId);

  const tokenRecord = {
    userId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || (existingRecord ? existingRecord.refreshToken : null),
    tokenType: tokens.token_type,
    scope: tokens.scope,
    expiresIn: tokens.expires_in,
    updatedAt: new Date().toISOString()
  };

  await saveTokenRecord(tokenRecord);

  return tokenRecord;
}

async function getTokensForUser(userId) {
  const tokenRecord = await getTokenRecordByUserId(userId);

  if (!tokenRecord) {
    return null;
  }

  return {
    access_token: tokenRecord.accessToken,
    refresh_token: tokenRecord.refreshToken,
    token_type: tokenRecord.tokenType,
    scope: tokenRecord.scope,
    expires_in: tokenRecord.expiresIn,
    updated_at: tokenRecord.updatedAt
  };
}

module.exports = {
  saveTokensForUser,
  getTokensForUser,
  isDynamoStoreEnabled
};
