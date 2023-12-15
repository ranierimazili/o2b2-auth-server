// The filename is suffixed with 'gsi' because this adapter makes use of Global Secondary Indexes.

/**
 * Prerequisites:
 * 
 * 1. Create a DynamoDB Table with following details:
 *        Partition Key: modelId
 *        TTL Attribute: expiresAt
 *        Three Global Secondary Indexes:
 *            GSI 1:
 *                Index Name: uidIndex
 *                Partition Key: uid
 *            GSI 2:
 *                Index Name: grantIdIndex
 *                Partition Key: grantId
 *            GSI 3:
 *                Index Name: userCodeIndex
 *                Partition Key: userCode
 *            GSI 4:
 *                Index Name: jwksUriIndex
 *                Partition Key: jwksUri
 * 
 * 2. Put the Table's name in environment variable OAUTH_TABLE or simply replace the value of constant TABLE_NAME below.
 * 
 * 3. You'll also need to change value of TABLE_REGION constant below if you aren't in AWS compute environment or if DynamoDB Table exists in different region.
 * 
 * 4. If you are in AWS' compute environment, nothing more needs to be changed in code.
 *    You just need to give proper IAM permissions of DynamoDB Table.
 *    Required Permissions:
 *        dynamodb:GetItem
 *        dynamodb:ConditionCheckItem
 *        dynamodb:UpdateItem
 *        dynamodb:DeleteItem
 *        dynamodb:Query
 *        dynamodb:BatchWriteItem
 *    If you aren't in AWS' compute environment, you'll also need to configure SDK with proper credentials.
 *    @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/configuring-the-jssdk.html
 */

// Author: Sachin Shekhar <https://github.com/SachinShekhar>
// Mention @SachinShekhar in issues to ask questions about this code.
// Modified to aws-sdk v3 by: Ranieri Mazili <https://github.com/ranierimazili>

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, QueryCommand, DeleteCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { config } from "../../shared/config.js";

const TABLE_NAME = config.db.dynamodb.tableName;

const client = new DynamoDBClient({region: config.db.dynamodb.region});
const docClient = DynamoDBDocumentClient.from(client,{
  marshallOptions: {
      removeUndefinedValues: true
  }
});

class DynamoDBAdapter {
  
  constructor(name) {
    this.name = name;
  }

  async upsert(id, payload, expiresIn) {
    try {
      // DynamoDB can recognise TTL values only in seconds
      const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;
      const params = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          modelId: this.name + "-" + id
        },
        UpdateExpression: "SET payload = :payload" 
          + (expiresAt ? ", expiresAt = :expiresAt" : "") 
          + (payload.userCode ? ", userCode = :userCode" : "") 
          + (payload.uid ? ", uid = :uid" : "") 
          + (payload.grantId ? ", grantId = :grantId" : "")
          + (payload.jwks_uri ? ", jwksUri = :jwksUri" : ""),
        ExpressionAttributeValues: {
          ":payload": payload,
          ...(expiresAt ? {
            ":expiresAt": expiresAt
          } : {}),
          ...(payload.userCode ? {
            ":userCode": payload.userCode
          } : {}),
          ...(payload.uid ? {
            ":uid": payload.uid
          } : {}),
          ...(payload.grantId ? {
            ":grantId": payload.grantId
          } : {}),
          ...(payload.jwks_uri ? {
            ":jwksUri": payload.jwks_uri
          } : {})
        }
      });
      await docClient.send(params);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async find(id) {
    const params = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        modelId: this.name + "-" + id
      },
      ProjectionExpression: "payload, expiresAt"
    });
    const result = (await docClient.send(params)).Item;

    // DynamoDB can take upto 48 hours to drop expired items, so a check is required
    if (!result || result.expiresAt && Date.now() > result.expiresAt * 1000) {
      return undefined;
    }
    return result.payload;
  }

  async findClientByJwksUri(jwksUri) {
    const params = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "jwksUriIndex",
      KeyConditionExpression: "jwksUri = :jwksUri",
      ExpressionAttributeValues: {
        ":jwksUri": jwksUri
      },
      Limit: 1
    });
    const result = (await docClient.send(params)).Items?.[0];

    if (!result) {
      return undefined;
    }
    return result;
  }

  async findByUserCode(userCode) {
    const params = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "userCodeIndex",
      KeyConditionExpression: "userCode = :userCode",
      ExpressionAttributeValues: {
        ":userCode": userCode
      },
      Limit: 1,
      ProjectionExpression: "payload, expiresAt"
    });
    const result = (await docClient.send(params)).Items?.[0];

    // DynamoDB can take upto 48 hours to drop expired items, so a check is required
    if (!result || result.expiresAt && Date.now() > result.expiresAt * 1000) {
      return undefined;
    }
    return result.payload;
  }

  async findByUid(uid) {
    const params = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "uidIndex",
      KeyConditionExpression: "uid = :uid",
      ExpressionAttributeValues: {
        ":uid": uid
      },
      Limit: 1,
      ProjectionExpression: "payload, expiresAt"
    });
    const result = (await docClient.send(params)).Items?.[0];

    // DynamoDB can take upto 48 hours to drop expired items, so a check is required
    if (!result || result.expiresAt && Date.now() > result.expiresAt * 1000) {
      return undefined;
    }
    return result.payload;
  }

  async consume(id) {
    const params = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        modelId: this.name + "-" + id
      },
      UpdateExpression: "SET #payload.#consumed = :value",
      ExpressionAttributeNames: {
        "#payload": "payload",
        "#consumed": "consumed"
      },
      ExpressionAttributeValues: {
        ":value": Math.floor(Date.now() / 1000)
      },
      ConditionExpression: "attribute_exists(modelId)"
    });
    await docClient.send(params);
  }

  async destroy(id) {
    const params = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        modelId: this.name + "-" + id
      }
    });
    await docClient.send(params);
  }

  async revokeByGrantId(grantId) {
    let ExclusiveStartKey = undefined;
    do {
      const params = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "grantIdIndex",
        KeyConditionExpression: "grantId = :grantId",
        ExpressionAttributeValues: {
          ":grantId": grantId
        },
        ProjectionExpression: "modelId",
        Limit: 25,
        ExclusiveStartKey
      });

      const queryResult = await docClient.send(params);
      ExclusiveStartKey = queryResult.LastEvaluatedKey;
      const items = queryResult.Items;
      if (!items || !items.length) {
        return;
      }
      const batchWriteParams = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: items.reduce((acc, item) => [...acc, {
            DeleteRequest: {
              Key: {
                modelId: item.modelId
              }
            }
          }], [])
        }
      });

      await docClient.send(batchWriteParams);
    } while (ExclusiveStartKey);
  }
}

export default DynamoDBAdapter;