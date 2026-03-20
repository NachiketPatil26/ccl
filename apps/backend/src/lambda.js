/**
 * Lambda handler for VitalOrb backend
 * Wraps Express app for AWS Lambda + API Gateway
 */
const serverlessExpress = require('@codegenie/serverless-express');
const { app } = require('./app');

const serverlessExpressHandler = serverlessExpress({ app });

exports.handler = async (event, context) => {
	return serverlessExpressHandler(event, context);
};
