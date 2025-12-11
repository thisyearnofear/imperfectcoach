FROM public.ecr.aws/lambda/nodejs:18

# Copy dependencies
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN npm ci --omit=dev

# Copy function code
COPY *.mjs ${LAMBDA_TASK_ROOT}/
COPY lib/ ${LAMBDA_TASK_ROOT}/lib/

# Set handler
CMD [ "agent-coach-handler.handler" ]
